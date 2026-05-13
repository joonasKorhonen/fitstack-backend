import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { S3Service } from '../s3/s3.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private s3: S3Service,
  ) {}

  async findById(userId: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Käyttäjää ei löytynyt');
    }

    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async updateUser(
    userId: number,
    dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    const updateData: any = {};

    // Check if username is being changed
    if (dto.username) {
      const existing = await this.findByUsername(dto.username);
      if (existing && existing.id !== userId) {
        throw new BadRequestException('Käyttäjänimi on jo käytössä');
      }
      updateData.username = dto.username;
    }

    // Re-hash password if being changed
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    // Require at least one field to update
    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException(
        'Vähintään yksi kenttä (username tai password) on annettava',
      );
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    return user;
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (user?.avatarUrl) {
      await this.s3.deleteByUrl(user.avatarUrl);
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Käyttäjätili poistettu onnistuneesti' };
  }

  async updateAvatar(
    userId: number,
    file: Express.Multer.File,
  ): Promise<UserResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (!existing) {
      throw new NotFoundException('Käyttäjää ei löytynyt');
    }

    const url = await this.s3.uploadFile(file, `avatars/${userId}`);

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (existing.avatarUrl) {
      await this.s3.deleteByUrl(existing.avatarUrl);
    }

    return updated;
  }

  async deleteAvatar(userId: number): Promise<UserResponseDto> {
    const existing = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (!existing) {
      throw new NotFoundException('Käyttäjää ei löytynyt');
    }

    if (existing.avatarUrl) {
      await this.s3.deleteByUrl(existing.avatarUrl);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: null },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }
}
