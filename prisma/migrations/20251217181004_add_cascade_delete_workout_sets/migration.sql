-- DropForeignKey
ALTER TABLE "public"."WorkoutSet" DROP CONSTRAINT "WorkoutSet_workoutId_fkey";

-- AddForeignKey
ALTER TABLE "public"."WorkoutSet" ADD CONSTRAINT "WorkoutSet_workoutId_fkey" FOREIGN KEY ("workoutId") REFERENCES "public"."Workout"("id") ON DELETE CASCADE ON UPDATE CASCADE;
