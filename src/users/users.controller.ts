import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    const userId = req.user.userId;
    return this.usersService.findById(userId);
  }

  @Patch('profile')
  async updateProfile(@Request() req, @Body() dto: UpdateUserDto) {
    const userId = req.user.userId;
    return this.usersService.updateUser(userId, dto);
  }

  @Delete('profile')
  async deleteProfile(@Request() req) {
    const userId = req.user.userId;
    return this.usersService.deleteUser(userId);
  }
}
