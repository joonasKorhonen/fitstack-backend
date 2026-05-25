import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
  ) {}
  private JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

  private generateAccessToken(userId: number, username: string): string {
    return jwt.sign({ userId, username }, this.JWT_SECRET, {
      expiresIn: '15m',
    });
  }

  private generateRefreshToken(): string {
    return crypto.randomBytes(40).toString('hex');
  }

  private async saveRefreshToken(
    userId: number,
    rawToken: string,
  ): Promise<void> {
    const hashed = await bcrypt.hash(rawToken, 10);
    const tokenFamily = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await this.prisma.refreshToken.create({
      data: { token: hashed, tokenFamily, userId, expiresAt },
    });
  }

  private async findAndValidateRefreshToken(rawToken: string) {
    const tokenFamily = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { tokenFamily },
      include: { user: true },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const isMatch = await bcrypt.compare(rawToken, tokenRecord.token);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return tokenRecord;
  }

  async register(username: string, password: string, email?: string) {
    const existing = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existing) throw new BadRequestException('Username already exists');

    if (email) {
      const emailTaken = await this.prisma.user.findUnique({
        where: { email },
      });
      if (emailTaken) throw new BadRequestException('Email already in use');
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { username, password: hashed, email: email ?? null },
    });

    const accessToken = this.generateAccessToken(user.id, user.username);
    const refreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const accessToken = this.generateAccessToken(user.id, user.username);
    const refreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(user.id, refreshToken);

    return { accessToken, refreshToken };
  }

  async refresh(rawRefreshToken: string) {
    const tokenRecord = await this.findAndValidateRefreshToken(rawRefreshToken);

    // Token rotation: delete old, create new
    await this.prisma.refreshToken.delete({
      where: { id: tokenRecord.id },
    });

    const accessToken = this.generateAccessToken(
      tokenRecord.user.id,
      tokenRecord.user.username,
    );
    const newRefreshToken = this.generateRefreshToken();
    await this.saveRefreshToken(tokenRecord.user.id, newRefreshToken);

    return { accessToken, refreshToken: newRefreshToken };
  }

  async logout(rawRefreshToken: string) {
    const tokenFamily = crypto
      .createHash('sha256')
      .update(rawRefreshToken)
      .digest('hex');

    await this.prisma.refreshToken.deleteMany({
      where: { tokenFamily },
    });

    return { message: 'Logged out successfully' };
  }

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      await this.prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto
        .createHash('sha256')
        .update(rawToken)
        .digest('hex');

      await this.prisma.passwordResetToken.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

      await this.mail.sendPasswordReset(email, resetUrl);
    }

    return {
      message:
        'Jos sähköpostiosoite on rekisteröity, lähetimme palautuslinkin.',
    };
  }

  async resetPassword(
    rawToken: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');

    const record = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException(
        'Palautuslinkki on virheellinen tai vanhentunut',
      );
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { password: hashed },
      }),
      this.prisma.passwordResetToken.deleteMany({
        where: { userId: record.userId },
      }),
      this.prisma.refreshToken.deleteMany({
        where: { userId: record.userId },
      }),
    ]);

    return { message: 'Salasana vaihdettu onnistuneesti' };
  }
}
