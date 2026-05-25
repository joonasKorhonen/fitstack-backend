import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateWorkoutDto,
  UpdateWorkoutDto,
  AddSetsDto,
  UpdateSetDto,
} from './dto/create-workout.dto';
import { MovementsService } from '../movements/movements.service';

@Injectable()
export class WorkoutsService {
  constructor(
    private prisma: PrismaService,
    private movementsService: MovementsService,
  ) {}

  async create(userId: number, dto: CreateWorkoutDto) {
    if (!dto.sets || dto.sets.length === 0) {
      throw new Error('Workout must have at least one set');
    }

    // Process sets to ensure movementId is set
    const processedSets = await Promise.all(
      dto.sets.map(async (set) => {
        let movementId = set.movementId;

        // If movementId not provided but exercise string is, find or create movement
        if (!movementId && set.exercise) {
          const movement = await this.movementsService.findOrCreate(
            userId,
            set.exercise,
          );
          movementId = movement.id;
        }

        return {
          movementId,
          reps: set.reps,
          weight: set.weight ?? null,
          intensity: set.intensity ?? null,
          notes: set.notes ?? null,
          exercise: set.exercise ?? null,
        };
      }),
    );

    const firstSet = processedSets[0];

    return this.prisma.workout.create({
      data: {
        userId,
        date: dto.date ? new Date(dto.date) : new Date(),
        notes: dto.notes ?? null,
        exercise: firstSet.exercise ?? 'Movement',
        reps: firstSet.reps,
        weight: firstSet.weight ?? null,
        sets: {
          create: processedSets,
        },
      },
      include: {
        sets: {
          include: {
            movement: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }

  async findAllForUser(userId: number) {
    return this.prisma.workout.findMany({
      where: { userId },
      include: {
        sets: {
          include: {
            movement: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(userId: number, id: number) {
    return this.prisma.workout.findFirst({
      where: { id, userId },
      include: {
        sets: {
          include: {
            movement: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
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

  async addSets(userId: number, workoutId: number, dto: AddSetsDto) {
    // Verify workout belongs to user
    const workout = await this.prisma.workout.findFirst({
      where: { id: workoutId, userId },
    });
    if (!workout) {
      throw new Error('Workout not found');
    }

    const processedSets = await Promise.all(
      dto.sets.map(async (set) => {
        let movementId = set.movementId;
        if (!movementId && set.exercise) {
          const movement = await this.movementsService.findOrCreate(
            userId,
            set.exercise,
          );
          movementId = movement.id;
        }
        return {
          workoutId,
          movementId,
          reps: set.reps,
          weight: set.weight ?? null,
          intensity: set.intensity ?? null,
          notes: set.notes ?? null,
          exercise: set.exercise ?? null,
        };
      }),
    );

    await this.prisma.workoutSet.createMany({ data: processedSets });

    return this.findOne(userId, workoutId);
  }

  async updateSet(workoutId: number, setId: number, dto: UpdateSetDto) {
    return this.prisma.workoutSet.updateMany({
      where: { id: setId, workoutId },
      data: {
        reps: dto.reps,
        weight: dto.weight,
        intensity: dto.intensity,
        notes: dto.notes,
      },
    });
  }

  async deleteSet(workoutId: number, setId: number) {
    return this.prisma.workoutSet.deleteMany({
      where: { id: setId, workoutId },
    });
  }
}
