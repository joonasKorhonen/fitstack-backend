# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm run start:dev` — Nest dev server with watch (http://localhost:3001/api)
- `npm run build` — compile to `dist/`
- `npm run start:prod` — run compiled build (`node dist/src/main`)
- `npm run lint` — ESLint with `--fix`
- `npm run format` — Prettier write over `src/` + `test/`
- `npm test` — Jest unit tests (`*.spec.ts` under `src/`)
- `npm run test:e2e` — Jest with `test/jest-e2e.json`
- Run a single test file: `npx jest src/auth/auth.service.spec.ts`
- Run tests matching a name: `npx jest -t "refresh"`
- `npm run docker:up` / `docker:down` / `docker:logs` — local Postgres + backend stack
- `npx prisma migrate dev` — create/apply migrations locally
- `npx prisma generate` — regenerate the Prisma client after editing [prisma/schema.prisma](prisma/schema.prisma)
- `npx prisma migrate deploy` — apply pending migrations without prompts (what CI runs)

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs `prisma generate` → `prisma migrate deploy` → `lint` → `build` against a Postgres 16 service on push/PR to `main`. **Before declaring work done, run `npm run lint && npm run build` locally** — these are the same checks CI enforces. If you touched [prisma/schema.prisma](prisma/schema.prisma), also confirm the migration applies cleanly.

## Environment

Requires `.env` (copy from [.env.example](.env.example)). The app calls `dotenv/config` at the top of [src/main.ts](src/main.ts), so missing values fall through to runtime errors rather than startup validation. Required vars: `DATABASE_URL`, `JWT_SECRET`, `AWS_ACCESS_KEY_ID`/`SECRET_ACCESS_KEY`/`REGION`/`S3_BUCKET`, `AWS_SES_FROM_EMAIL`, `FRONTEND_URL`. `PORT` defaults to 3001.

Node 22+ (matches CI). The frontend ([../fitstack-frontend](../fitstack-frontend)) expects this API at `http://localhost:3001` and sends credentials, so CORS in [src/main.ts](src/main.ts) uses `origin: FRONTEND_URL` with `credentials: true` — both must agree or the refresh cookie won't flow.

## Architecture

### Module layout

Standard Nest module-per-resource layout under [src/](src/): `auth`, `users`, `workouts`, `movements`, `meals`, plus infrastructure modules `prisma`, `s3`, `mail`. [PrismaModule](src/prisma/prisma.module.ts) is `@Global()`, so `PrismaService` is available everywhere without re-importing. All routes are mounted under the `/api` global prefix set in [src/main.ts](src/main.ts), and a global `ValidationPipe` with `whitelist`, `forbidNonWhitelisted`, and `transform` strips unknown fields from every DTO automatically — don't add per-controller pipes for that.

### Auth: access tokens + httpOnly refresh cookies

Two-token scheme implemented in [src/auth/auth.service.ts](src/auth/auth.service.ts):

1. **Access token** — JWT signed with `JWT_SECRET`, 15 min TTL, returned in the JSON body. The frontend keeps this in memory.
2. **Refresh token** — random 40-byte hex, bcrypt-hashed at rest, 7-day TTL. The raw value is sent to the client **only as an httpOnly cookie** named `refreshToken` (see [auth.controller.ts:90-107](src/auth/auth.controller.ts#L90-L107)) — never in the response body.

Refresh tokens are looked up by `tokenFamily` (sha256 of the raw token, which is `@unique`), then compared against the bcrypt hash. Rotation deletes the old row before issuing a new one. Logout deletes by `tokenFamily`. Password reset (`reset-password`) wipes *all* refresh tokens for that user in the same transaction as the password update.

Protected routes use `@UseGuards(JwtAuthGuard)` from [src/auth/jwt-auth.guard.ts](src/auth/jwt-auth.guard.ts). The guard verifies the `Authorization: Bearer …` header and attaches `request.user = { userId, username }`. In controllers, type the request as `AuthenticatedRequest` from [src/auth/types/authenticated-request.ts](src/auth/types/authenticated-request.ts) and read `req.user.userId` — don't inline `any` or destructure off `Request`.

### Persistence (Prisma)

Schema in [prisma/schema.prisma](prisma/schema.prisma). DB columns and tables are snake_case via `@map`/`@@map`; TypeScript fields stay camelCase — keep this convention when adding fields. Cascade behavior is set per relation (most user-owned data uses `onDelete: Cascade`); think about it explicitly when adding new relations.

### S3 avatars: store keys, derive URLs

[S3Service](src/s3/s3.service.ts) stores **only the S3 object key** in the database (column `User.avatarPath`); the public URL is derived at read time via `s3.getUrl(key)`. The `UserResponseDto` still exposes `avatarUrl` to clients — the mapping happens in `UsersService.toDto` ([src/users/users.service.ts](src/users/users.service.ts)). When adding endpoints that return a user, route through `toDto` so the key→URL conversion stays in one place. Avatar replacement is ordered upload → persist → delete-old so a failure in the delete step is harmless.

### Mail (SES)

[MailService](src/mail/mail.service.ts) wraps AWS SES for transactional emails (currently password reset). The reset link is built from `FRONTEND_URL` — point this at the deployed frontend in production.

### Conventions

- **UI-facing strings are Finnish** (error messages thrown to the client, e.g. `'Käyttäjää ei löytynyt'`, `'Salasana vaihdettu onnistuneesti'`). Code, identifiers, and comments stay in English. Match this when adding new exceptions/messages.
- DTOs live in `<module>/dto/`. Validation is declarative via `class-validator` decorators — the global `ValidationPipe` does the rest.
- Don't read `req.cookies` untyped — cast through `Record<string, string>` as in [auth.controller.ts:109-112](src/auth/auth.controller.ts#L109-L112). The lint config flags unsafe-any access on `req`.
