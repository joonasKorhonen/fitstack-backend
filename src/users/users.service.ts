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
import * as sharp from 'sharp';
import { Prisma, User } from '@prisma/client';

const AVATAR_SIZE = 512;
const AVATAR_QUALITY = 85;

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
        email: true,
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
    const updateData: Prisma.UserUpdateInput = {};

    if (dto.username) {
      const existing = await this.findByUsername(dto.username);
      if (existing && existing.id !== userId) {
        throw new BadRequestException('Käyttäjänimi on jo käytössä');
      }
      updateData.username = dto.username;
    }

    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existing && existing.id !== userId) {
        throw new BadRequestException('Sähköpostiosoite on jo käytössä');
      }
      updateData.email = dto.email;
    }

    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    if (Object.keys(updateData).length === 0) {
      throw new BadRequestException(
        'Vähintään yksi kenttä (username, email tai password) on annettava',
      );
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
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

    const processed = await sharp(file.buffer)
      .rotate()
      .resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover', position: 'centre' })
      .webp({ quality: AVATAR_QUALITY })
      .toBuffer();

    const url = await this.s3.uploadFile(
      {
        ...file,
        buffer: processed,
        mimetype: 'image/webp',
        originalname: 'avatar.webp',
      },
      `avatars/${userId}`,
    );

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
      select: {
        id: true,
        username: true,
        email: true,
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
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });
  }
}
