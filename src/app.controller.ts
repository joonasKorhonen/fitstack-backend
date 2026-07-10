import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller('api')
export class AppController {
  constructor(private prisma: PrismaService) {}

  @Get('health')
  health() {
    return { ok: true };
  }

  @Get('db-health')
  async dbHealth() {
    const now = await this.prisma.$queryRaw`SELECT NOW()`;
    return { ok: true, now };
  }
}
