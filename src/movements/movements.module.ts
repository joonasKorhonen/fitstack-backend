import { Module } from '@nestjs/common';
import { MovementsService } from './movements.service';
import { MovementsController } from './movements.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MovementsController],
  providers: [MovementsService],
  exports: [MovementsService],
})
export class MovementsModule {}
