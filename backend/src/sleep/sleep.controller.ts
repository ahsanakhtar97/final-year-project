import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';

import { UpsertSleepLogDto } from './dto/upsert-sleep-log.dto';
import { SleepService } from './sleep.service';

interface AuthedRequest extends Request {
  user: { userId: number };
}

@ApiTags('sleep')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'sleep', version: '1' })
export class SleepController {
  constructor(private readonly service: SleepService) {}

  @Post()
  @ApiOperation({ summary: 'Log or update a night of sleep.' })
  upsert(@Req() req: AuthedRequest, @Body() dto: UpsertSleepLogDto) {
    return this.service.upsert(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Recent nights for the current user.' })
  recent(@Req() req: AuthedRequest, @Query('days') days?: string) {
    const n = days ? Math.min(180, Math.max(1, Number(days))) : 30;
    return this.service.recent(req.user.userId, n);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove one sleep log.' })
  remove(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(req.user.userId, id);
  }
}
