-- CreateTable
CREATE TABLE "public"."WorkoutSet" (
    "id" SERIAL NOT NULL,
    "exercise" TEXT NOT NULL,
    "reps" INTEGER NOT NULL,
    "weight" DOUBLE PRECISION,
    "intensity" INTEGER,
    "notes" TEXT,
    "workoutId" INTEGER NOT NULL,

    CONSTRAINT "WorkoutSet_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."WorkoutSet" ADD CONSTRAINT "WorkoutSet_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "public"."Workout"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
