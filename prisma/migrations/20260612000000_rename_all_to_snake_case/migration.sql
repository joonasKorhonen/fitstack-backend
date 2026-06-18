-- Rename all tables and columns from Prisma's PascalCase / camelCase conventions
-- to snake_case so both the NestJS and Laravel backends can share the same schema.
--
-- All existing data is preserved — only names change.

BEGIN;

-- ── Rename columns before renaming tables (avoids ambiguity) ─────────────────

-- User
ALTER TABLE "public"."User" RENAME COLUMN "createdAt"  TO "created_at";
ALTER TABLE "public"."User" RENAME COLUMN "avatarPath" TO "avatar_path";

-- PasswordResetToken
ALTER TABLE "public"."PasswordResetToken" RENAME COLUMN "tokenHash" TO "token_hash";
ALTER TABLE "public"."PasswordResetToken" RENAME COLUMN "userId"    TO "user_id";
ALTER TABLE "public"."PasswordResetToken" RENAME COLUMN "expiresAt" TO "expires_at";
ALTER TABLE "public"."PasswordResetToken" RENAME COLUMN "createdAt" TO "created_at";

-- RefreshToken (add deleted_at for soft-delete support, rename columns)
ALTER TABLE "public"."RefreshToken" RENAME COLUMN "tokenFamily" TO "token_family";
ALTER TABLE "public"."RefreshToken" RENAME COLUMN "userId"      TO "user_id";
ALTER TABLE "public"."RefreshToken" RENAME COLUMN "expiresAt"   TO "expires_at";
ALTER TABLE "public"."RefreshToken" RENAME COLUMN "createdAt"   TO "created_at";
ALTER TABLE "public"."RefreshToken" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- Workout
ALTER TABLE "public"."Workout" RENAME COLUMN "userId"    TO "user_id";
ALTER TABLE "public"."Workout" RENAME COLUMN "createdAt" TO "created_at";
ALTER TABLE "public"."Workout" RENAME COLUMN "updatedAt" TO "updated_at";

-- WorkoutSet
ALTER TABLE "public"."WorkoutSet" RENAME COLUMN "movementId" TO "movement_id";
ALTER TABLE "public"."WorkoutSet" RENAME COLUMN "workoutId"  TO "workout_id";

-- Movement
ALTER TABLE "public"."Movement" RENAME COLUMN "userId"    TO "user_id";
ALTER TABLE "public"."Movement" RENAME COLUMN "createdAt" TO "created_at";

-- Meal
ALTER TABLE "public"."Meal" RENAME COLUMN "userId"    TO "user_id";
ALTER TABLE "public"."Meal" RENAME COLUMN "createdAt" TO "created_at";

-- ── Rename tables ─────────────────────────────────────────────────────────────

ALTER TABLE "public"."User"               RENAME TO "users";
ALTER TABLE "public"."PasswordResetToken" RENAME TO "password_reset_tokens";
ALTER TABLE "public"."RefreshToken"       RENAME TO "refresh_tokens";
ALTER TABLE "public"."Workout"            RENAME TO "workouts";
ALTER TABLE "public"."WorkoutSet"         RENAME TO "workout_sets";
ALTER TABLE "public"."Movement"           RENAME TO "movements";
ALTER TABLE "public"."Meal"               RENAME TO "meals";

-- ── Rename indexes to match new table names (optional, keeps things tidy) ────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'User_email_key')     THEN ALTER INDEX "User_email_key"     RENAME TO "users_email_key"; END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'User_username_key')  THEN ALTER INDEX "User_username_key"  RENAME TO "users_username_key"; END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'User_pkey')          THEN ALTER INDEX "User_pkey"          RENAME TO "users_pkey"; END IF;
END $$;

COMMIT;
