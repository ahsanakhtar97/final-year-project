import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HabitLogsService } from './habit-logs.service';
import { CreateHabitLogDto } from './dto/create-habit-log.dto';
import { UpdateHabitLogDto } from './dto/update-habit-log.dto';
import { HabitLog } from './entities/habit-log.entity';

@Controller('habit-logs')
export class HabitLogsController {
  constructor(private readonly habitLogsService: HabitLogsService) { }

  @Post()
  async create(@Body() createHabitLogDto: CreateHabitLogDto) {

  }

  @Get()
  findAll(): Promise<HabitLog[]> {
    return this.habitLogsService.findAll();
  }

  @Get(':logId')
  async findOne(@Param('logId') logId: number) {
    return this.habitLogsService.findOne(logId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHabitLogDto: UpdateHabitLogDto) {
    return this.habitLogsService.update(+id, updateHabitLogDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.habitLogsService.remove(+id);
  }
}
