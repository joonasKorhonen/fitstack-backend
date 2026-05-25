import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { MovementsModule } from './movements/movements.module';
import { MealsModule } from './meals/meals.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    WorkoutsModule,
    MovementsModule,
    MealsModule,
  ],
})
export class AppModule {}
