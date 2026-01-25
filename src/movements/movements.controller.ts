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
import { CreateMovementDto } from './dto/create-movement.dto';

@UseGuards(JwtAuthGuard)
@Controller('movements')
export class MovementsController {
  constructor(private readonly movementsService: MovementsService) {}

  @Get()
  async findAll(@Request() req) {
    const userId = req.user.userId;
    return this.movementsService.findAllForUser(userId);
  }

  @Post()
  async create(@Request() req, @Body() dto: CreateMovementDto) {
    const userId = req.user.userId;
    return this.movementsService.create(userId, dto);
  }
}
