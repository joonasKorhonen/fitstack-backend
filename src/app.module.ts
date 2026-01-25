import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkoutsModule } from './workouts/workouts.module';
import { MovementsModule } from './movements/movements.module';

@Module({
  imports: [PrismaModule, AuthModule, WorkoutsModule, MovementsModule],
})
export class AppModule {}
