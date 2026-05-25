import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Request,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedRequest } from '../auth/types/authenticated-request';

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req: AuthenticatedRequest) {
    return this.usersService.findById(req.user.userId);
  }

  @Patch('profile')
  async updateProfile(
    @Request() req: AuthenticatedRequest,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateUser(req.user.userId, dto);
  }

  @Delete('profile')
  async deleteProfile(@Request() req: AuthenticatedRequest) {
    return this.usersService.deleteUser(req.user.userId);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('file'))
  async uploadAvatar(
    @Request() req: AuthenticatedRequest,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: MAX_AVATAR_SIZE }),
          new FileTypeValidator({ fileType: /^image\/(jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Tiedostoa ei lähetetty');
    }
    return this.usersService.updateAvatar(req.user.userId, file);
  }

  @Delete('avatar')
  async deleteAvatar(@Request() req: AuthenticatedRequest) {
    return this.usersService.deleteAvatar(req.user.userId);
  }
}
