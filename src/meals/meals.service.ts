import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMealDto, UpdateMealDto } from './dto/create-meal.dto';

@Injectable()
export class MealsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateMealDto) {
    return this.prisma.meal.create({
      data: {
        userId,
        title: dto.title,
        calories: dto.calories,
        date: dto.date ? new Date(dto.date) : new Date(),
        protein: dto.protein ?? null,
        carbs: dto.carbs ?? null,
        fat: dto.fat ?? null,
        notes: dto.notes ?? null,
      },
    });
  }

  async findAllForUser(userId: number) {
    return this.prisma.meal.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(userId: number, id: number) {
    return this.prisma.meal.findFirst({
      where: { id, userId },
    });
  }

  async update(userId: number, id: number, dto: UpdateMealDto) {
    return this.prisma.meal.updateMany({
      where: { id, userId },
      data: {
        title: dto.title,
        calories: dto.calories,
        date: dto.date ? new Date(dto.date) : undefined,
        protein: dto.protein,
        carbs: dto.carbs,
        fat: dto.fat,
        notes: dto.notes,
      },
    });
  }

  async delete(userId: number, id: number) {
    return this.prisma.meal.deleteMany({
      where: { id, userId },
    });
  }
}
