import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(userId: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
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
        createdAt: true,
      },
    });

    return user;
  }

  async deleteUser(userId: number): Promise<{ message: string }> {
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Käyttäjätili poistettu onnistuneesti' };
  }
}
