# FitStack Backend

[![CI](https://github.com/joonasKorhonen/fitstack-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/joonasKorhonen/fitstack-backend/actions/workflows/ci.yml)

REST API for **FitStack**, a fitness tracking app where users log workouts (with sets, reps, weight, and intensity), define custom exercises, track meals with macronutrients, and manage their profile.

## Tech Stack

- **NestJS 11** (TypeScript, Express)
- **PostgreSQL 16** via **Prisma 6** ORM
- **JWT** auth with refresh token rotation
- **AWS S3** for profile picture storage (with server-side image resizing via `sharp`)
- **AWS SES** for password reset emails
- **Docker Compose** for local development
- Validation via `class-validator` / `class-transformer`

## Features

- **Auth** — register, login, refresh tokens, logout, forgot/reset password
- **Users** — profile fetch/update/delete, avatar upload (jpeg/png/webp, 5 MB max, auto-resized to 512×512 WebP)
- **Workouts** — log workouts with multiple sets, exercises, reps, weight, intensity, and notes
- **Movements** — user-defined custom exercise library
- **Meals** — track meals with calories, protein, carbs, fat
- All routes (except `auth/*`) are JWT-protected

## Prerequisites

- Node.js 20+
- Docker (for local Postgres) or a local PostgreSQL instance
- AWS account with:
  - An S3 bucket (public read for objects, scoped IAM credentials)
  - A verified SES sender identity (sandbox mode is fine for development)

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required variables:

| Variable                | Purpose                                                    |
| ----------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`          | PostgreSQL connection string                               |
| `JWT_SECRET`            | Secret for signing access tokens                           |
| `PORT`                  | Application port (defaults to 3001)                        |
| `AWS_ACCESS_KEY_ID`     | IAM user access key                                        |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret                                            |
| `AWS_REGION`            | AWS region for S3 & SES (e.g. `eu-north-1`)                |
| `AWS_S3_BUCKET`         | S3 bucket name for avatar uploads                          |
| `AWS_SES_FROM_EMAIL`    | Verified SES sender address                                |
| `FRONTEND_URL`          | Base URL used in password reset email links                |

### 3. Start the database

Using Docker:

```bash
npm run docker:up
```

Or point `DATABASE_URL` at a local Postgres instance.

### 4. Apply Prisma migrations

```bash
npx prisma migrate dev
```

### 5. Run the API

```bash
# watch mode
npm run start:dev

# production
npm run build && npm run start:prod
```

The API listens on `http://localhost:3001/api` by default.

## API Overview

All routes are mounted under `/api`.

### Auth (`/auth`)

| Method | Path                | Description                                        |
| ------ | ------------------- | -------------------------------------------------- |
| POST   | `/register`         | Create account (`username`, `password`, optional `email`) |
| POST   | `/login`            | Returns access + refresh tokens                    |
| POST   | `/refresh`          | Rotate refresh token, issue new access token       |
| POST   | `/logout`           | Invalidate refresh token                           |
| POST   | `/forgot-password`  | Send reset link to verified email                  |
| POST   | `/reset-password`   | Submit token + new password                        |

### Users (`/users`) — JWT required

| Method | Path       | Description                          |
| ------ | ---------- | ------------------------------------ |
| GET    | `/profile` | Current user                         |
| PATCH  | `/profile` | Update `username`, `email`, `password` |
| DELETE | `/profile` | Delete account (also deletes avatar from S3) |
| POST   | `/avatar`  | Upload profile picture (multipart, field `file`) |
| DELETE | `/avatar`  | Remove current avatar                |

### Workouts (`/workouts`) — JWT required

CRUD for workouts and their sets, plus an endpoint to append a set to an existing workout.

### Movements (`/movements`) — JWT required

CRUD for the user's custom exercise library.

### Meals (`/meals`) — JWT required

CRUD for meals with macronutrient fields.

## Scripts

| Command                   | Purpose                              |
| ------------------------- | ------------------------------------ |
| `npm run start:dev`       | Watch mode dev server                |
| `npm run build`           | Compile to `dist/`                   |
| `npm run start:prod`      | Run compiled build                   |
| `npm run lint`            | ESLint with autofix                  |
| `npm run format`          | Prettier write                       |
| `npm run test`            | Unit tests                           |
| `npm run test:e2e`        | End-to-end tests                     |
| `npm run docker:up`       | Start Postgres + backend in Docker   |
| `npm run docker:down`     | Stop Docker stack                    |
| `npm run docker:logs`     | Tail backend container logs          |

## Project Structure

```
src/
├── auth/        JWT auth, registration, password reset
├── users/       Profile management, avatar uploads
├── workouts/    Workout + WorkoutSet endpoints
├── movements/   Custom exercise library
├── meals/       Meal tracking
├── mail/        AWS SES wrapper (transactional emails)
├── s3/          AWS S3 wrapper (file uploads)
├── prisma/      Prisma client module
├── app.module.ts
└── main.ts
```
