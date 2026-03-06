import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
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

  async register(username: string, password: string) {
    const existing = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existing) throw new BadRequestException('Username already exists');

    const hashed = await bcrypt.hash(password, 10);
    const user = await this.prisma.user.create({
      data: { username, password: hashed },
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
    const tokenRecord =
      await this.findAndValidateRefreshToken(rawRefreshToken);

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
}
