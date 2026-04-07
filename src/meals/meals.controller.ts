import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { MealsService } from './meals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateMealDto, UpdateMealDto } from './dto/create-meal.dto';

@UseGuards(JwtAuthGuard)
@Controller('meals')
export class MealsController {
  constructor(private readonly mealsService: MealsService) {}

  @Post()
  async create(@Request() req, @Body() dto: CreateMealDto) {
    const userId = req.user.userId;
    return this.mealsService.create(userId, dto);
  }

  @Get()
  async findAll(@Request() req) {
    const userId = req.user.userId;
    return this.mealsService.findAllForUser(userId);
  }

  @Get(':id')
  async findOne(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req.user.userId;
    return this.mealsService.findOne(userId, id);
  }

  @Patch(':id')
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMealDto,
  ) {
    const userId = req.user.userId;
    return this.mealsService.update(userId, id, dto);
  }

  @Delete(':id')
  async delete(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req.user.userId;
    return this.mealsService.delete(userId, id);
  }
}