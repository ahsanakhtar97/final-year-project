import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { CreateHabitLogDto } from './dto/create-habit-log.dto';
import { UpdateHabitLogDto } from './dto/update-habit-log.dto';
import { HabitLog } from './entities/habit-log.entity';
import { HabitLogsService } from './habit-logs.service';

@ApiTags('habit-logs')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'habit-logs', version: '1' })
export class HabitLogsController {
  constructor(private readonly habitLogsService: HabitLogsService) {}

  @Post('complete')
  @ApiOperation({ summary: 'Record a habit completion (the “tick” action).' })
  create(@Body() createHabitLogDto: CreateHabitLogDto): Promise<HabitLog> {
    return this.habitLogsService.create(createHabitLogDto);
  }

  @Get()
  @ApiOperation({
    summary: 'List habit logs. Pass ?userId= to scope to a single user.',
  })
  @ApiQuery({ name: 'userId', required: false, type: Number })
  findAll(
    @Query('userId') userId?: string,
  ): Promise<HabitLog[]> {
    if (userId !== undefined) {
      const parsed = Number(userId);
      if (Number.isFinite(parsed) && parsed > 0) {
        return this.habitLogsService.findByUserId(parsed);
      }
    }
    return this.habitLogsService.findAll();
  }

  @Get(':logId')
  @ApiOperation({ summary: 'Fetch a single log by id.' })
  findOne(@Param('logId', ParseIntPipe) logId: number): Promise<HabitLog> {
    return this.habitLogsService.findOne(logId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a log’s fields (date, status, moodScore).' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHabitLogDto: UpdateHabitLogDto,
  ): Promise<HabitLog> {
    return this.habitLogsService.update(id, updateHabitLogDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a log.' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.habitLogsService.remove(id);
  }
}
