import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MovementsService } from './movements.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/types/authenticated-request';
import { CreateMovementDto } from './dto/create-movement.dto';

@UseGuards(JwtAuthGuard)
@Controller('movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    return this.movementsService.findAllForUser(userId);
  }

  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateMovementDto,
  ) {
    const userId = req.user.userId;
    return this.movementsService.create(userId, dto);
  }
}
