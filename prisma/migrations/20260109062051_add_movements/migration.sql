-- AlterTable
ALTER TABLE "public"."WorkoutSet" ADD COLUMN     "movementId" INTEGER,
ALTER COLUMN "exercise" DROP NOT NULL;

-- CreateTable
CREATE TABLE "public"."Movement" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Movement_userId_idx" ON "public"."Movement"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Movement_userId_name_key" ON "public"."Movement"("userId", "name");

-- CreateIndex
CREATE INDEX "WorkoutSet_movementId_idx" ON "public"."WorkoutSet"("movementId");

-- AddForeignKey
ALTER TABLE "public"."WorkoutSet" ADD CONSTRAINT "WorkoutSet_movementId_fkey" FOREIGN KEY ("movementId") REFERENCES "public"."Movement"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Movement" ADD CONSTRAINT "Movement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
