import { Module } from '@nestjs/common';
import { WorkoutsService } from './workouts.service';
import { WorkoutsController } from './workouts.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { MovementsModule } from '../movements/movements.module';

@Module({
  imports: [PrismaModule, MovementsModule],
  controllers: [WorkoutsController],
  providers: [WorkoutsService],
})
export class WorkoutsModule {}
