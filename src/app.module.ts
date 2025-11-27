import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkoutsModule } from './workouts/workouts.module';

@Module({
  imports: [PrismaModule, AuthModule, WorkoutsModule],
})
export class AppModule {}
