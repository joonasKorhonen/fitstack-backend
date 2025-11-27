import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkoutDto, UpdateWorkoutDto } from '../auth/dto/create-workout.dto';

@Injectable()
export class WorkoutsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateWorkoutDto) {
    if (!dto.sets || dto.sets.length === 0) {
      throw new Error('Workout must have at least one set');
    }

    const firstSet = dto.sets[0];

    return this.prisma.workout.create({
      data: {
        userId,
        date: dto.date ? new Date(dto.date) : new Date(),
        notes: dto.notes ?? null,
        exercise: firstSet.exercise,
        reps: firstSet.reps,
        weight: firstSet.weight ?? null,
        sets: {
          create: dto.sets.map((set) => ({
            exercise: set.exercise,
            reps: set.reps,
            weight: set.weight ?? null,
            intensity: set.intensity ?? null,
            notes: set.notes ?? null,
          })),
        },
      },
      include: { sets: true },
    });
  }

  async findAllForUser(userId: number) {
    return this.prisma.workout.findMany({
      where: { userId },
      include: { sets: true },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(userId: number, id: number) {
    return this.prisma.workout.findFirst({
      where: { id, userId },
      include: { sets: true },
    });
  }

  async updateWorkout(userId: number, id: number, dto: UpdateWorkoutDto) {
    // Päivitys vain Workout-tasolle; setien päivitys voidaan tehdä erikseen
    return this.prisma.workout.updateMany({
      where: { id, userId },
      data: {
        date: dto.date ? new Date(dto.date) : undefined,
        notes: dto.notes ?? undefined,
      },
    });
  }

  async deleteWorkout(userId: number, id: number) {
    return this.prisma.workout.deleteMany({
      where: { id, userId },
    });
  }

  async deleteSet(workoutId: number, setId: number) {
    return this.prisma.workoutSet.deleteMany({
      where: { id: setId, workoutId },
    });
  }
}
