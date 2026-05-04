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

import { UpsertMoodLogDto } from './dto/upsert-mood-log.dto';
import { MoodService } from './mood.service';

interface AuthedRequest extends Request {
  user: { userId: number };
}

@ApiTags('mood')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'mood', version: '1' })
export class MoodController {
  constructor(private readonly service: MoodService) {}

  @Post()
  @ApiOperation({ summary: 'Log or update a mood check-in for a given date.' })
  upsert(@Req() req: AuthedRequest, @Body() dto: UpsertMoodLogDto) {
    return this.service.upsert(req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Recent mood logs for the current user.' })
  recent(@Req() req: AuthedRequest, @Query('days') days?: string) {
    const n = days ? Math.min(180, Math.max(1, Number(days))) : 30;
    return this.service.recent(req.user.userId, n);
  }

  @Get('today')
  @ApiOperation({ summary: "Today's mood log, or null if not yet logged." })
  today(@Req() req: AuthedRequest) {
    return this.service.today(req.user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a mood log entry.' })
  remove(@Req() req: AuthedRequest, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(req.user.userId, id);
  }
}
