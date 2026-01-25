import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateExercisesToMovements() {
  console.log('Starting exercise to movement migration...');

  // Get all unique exercise strings with their user associations
  const workoutSets = await prisma.workoutSet.findMany({
    where: {
      exercise: { not: null },
      movementId: null, // Only migrate unmigrated sets
    },
    include: {
      workout: {
        select: {
          userId: true,
        },
      },
    },
  });

  console.log(`Found ${workoutSets.length} workout sets to migrate`);

  if (workoutSets.length === 0) {
    console.log('No workout sets to migrate. All done!');
    return;
  }

  // Group by user and exercise name
  const userExercises = new Map<number, Set<string>>();

  for (const set of workoutSets) {
    const userId = set.workout.userId;
    const exerciseName = set.exercise!.trim();

    if (!userExercises.has(userId)) {
      userExercises.set(userId, new Set());
    }
    userExercises.get(userId)!.add(exerciseName);
  }

  // Create Movement records for each unique (userId, exercise) pair
  const movementMap = new Map<string, number>(); // key: "userId:exerciseName" -> movementId

  for (const [userId, exercises] of userExercises.entries()) {
    console.log(`Creating ${exercises.size} movements for user ${userId}`);

    for (const exerciseName of exercises) {
      const movement = await prisma.movement.upsert({
        where: {
          userId_name: {
            userId,
            name: exerciseName,
          },
        },
        create: {
          userId,
          name: exerciseName,
        },
        update: {}, // No-op if exists
      });

      movementMap.set(`${userId}:${exerciseName}`, movement.id);
    }
  }

  // Update WorkoutSet records to reference Movement
  let updatedCount = 0;
  for (const set of workoutSets) {
    const userId = set.workout.userId;
    const exerciseName = set.exercise!.trim();
    const movementId = movementMap.get(`${userId}:${exerciseName}`);

    if (movementId) {
      await prisma.workoutSet.update({
        where: { id: set.id },
        data: { movementId },
      });
      updatedCount++;
    }
  }

  console.log(`Migration complete! Updated ${updatedCount} workout sets`);
}

migrateExercisesToMovements()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
