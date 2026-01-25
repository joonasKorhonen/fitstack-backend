import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMovementDto } from './dto/create-movement.dto';

@Injectable()
export class MovementsService {
  constructor(private prisma: PrismaService) {}

  async findAllForUser(userId: number) {
    return this.prisma.movement.findMany({
      where: { userId },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });
  }

  async create(userId: number, dto: CreateMovementDto) {
    const name = dto.name.trim();

    // Check for duplicate
    const existing = await this.prisma.movement.findUnique({
      where: {
        userId_name: {
          userId,
          name,
        },
      },
    });

    if (existing) {
      throw new ConflictException('Movement with this name already exists');
    }

    return this.prisma.movement.create({
      data: {
        userId,
        name,
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });
  }

  async findOrCreate(userId: number, name: string) {
    const trimmedName = name.trim();

    return this.prisma.movement.upsert({
      where: {
        userId_name: {
          userId,
          name: trimmedName,
        },
      },
      create: {
        userId,
        name: trimmedName,
      },
      update: {}, // No-op if exists
      select: {
        id: true,
        name: true,
        createdAt: true,
      },
    });
  }
}
