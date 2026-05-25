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
import { WorkoutsService } from './workouts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/types/authenticated-request';
import {
  CreateWorkoutDto,
  UpdateWorkoutDto,
  AddSetsDto,
  UpdateSetDto,
} from './dto/create-workout.dto';

@UseGuards(JwtAuthGuard)
@Controller('workouts')
export class WorkoutsController {
  constructor(private readonly workoutsService: WorkoutsService) {}

  @Post()
  async create(
    @Request() req: AuthenticatedRequest,
    @Body() dto: CreateWorkoutDto,
  ) {
    try {
      const userId = req.user.userId;
      console.log('Creating workout for userId:', userId);
      console.log('Received data:', JSON.stringify(dto, null, 2));
      return await this.workoutsService.create(userId, dto);
    } catch (error) {
      console.error('Error creating workout:', error);
      throw error;
    }
  }

  @Get()
  async findAll(@Request() req: AuthenticatedRequest) {
    const userId = req.user.userId;
    return this.workoutsService.findAllForUser(userId);
  }

  @Get(':id')
  async findOne(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req.user.userId;
    return this.workoutsService.findOne(userId, id);
  }

  @Patch(':id')
  async updateWorkout(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateWorkoutDto,
  ) {
    const userId = req.user.userId;
    return this.workoutsService.updateWorkout(userId, id, dto);
  }

  @Delete(':id')
  async deleteWorkout(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const userId = req.user.userId;
    return this.workoutsService.deleteWorkout(userId, id);
  }

  @Post(':id/sets')
  async addSets(
    @Request() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AddSetsDto,
  ) {
    const userId = req.user.userId;
    return this.workoutsService.addSets(userId, id, dto);
  }

  @Patch(':workoutId/sets/:setId')
  async updateSet(
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @Param('setId', ParseIntPipe) setId: number,
    @Body() dto: UpdateSetDto,
  ) {
    return this.workoutsService.updateSet(workoutId, setId, dto);
  }

  @Delete(':workoutId/sets/:setId')
  async deleteSet(
    @Param('workoutId', ParseIntPipe) workoutId: number,
    @Param('setId', ParseIntPipe) setId: number,
  ) {
    return this.workoutsService.deleteSet(workoutId, setId);
  }
}
