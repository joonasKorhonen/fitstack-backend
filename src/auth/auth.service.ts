import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
  private JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

  async register(username: string, password: string) {
    const existing = await this.prisma.user.findUnique({ where: { username } });
    if (existing) throw new BadRequestException('Username already exists');
    const hashed = await bcrypt.hash(password, 10);
    await this.prisma.user.create({ data: { username, password: hashed } });
    return { message: 'User registered successfully' };
  }

  async login(username: string, password: string) {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) throw new UnauthorizedException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');
    const token = jwt.sign({ userId: user.id, username: user.username }, this.JWT_SECRET, { expiresIn: '2h' });
    return { token };
  }
}
