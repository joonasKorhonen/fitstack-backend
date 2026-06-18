-- Rename column: store only the S3 object key, not the full URL
ALTER TABLE "public"."User" RENAME COLUMN "avatarUrl" TO "avatarPath";

-- Migrate existing data: strip the S3 base URL prefix from any full URLs already stored.
-- Matches the pattern "https://<bucket>.s3.<region>.amazonaws.com/<key>" and keeps only <key>.
-- Rows that already contain only a key (no "https://") are left unchanged.
UPDATE "public"."User"
SET "avatarPath" = regexp_replace("avatarPath", '^https://[^/]+\.amazonaws\.com/', '')
WHERE "avatarPath" IS NOT NULL
  AND "avatarPath" LIKE 'https://%';
