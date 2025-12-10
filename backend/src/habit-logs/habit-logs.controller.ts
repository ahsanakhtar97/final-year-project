import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HabitLogsService } from './habit-logs.service';
import { CreateHabitLogDto } from './dto/create-habit-log.dto';
import { UpdateHabitLogDto } from './dto/update-habit-log.dto';

@Controller('habit-logs')
export class HabitLogsController {
  constructor(private readonly habitLogsService: HabitLogsService) {}

  @Post()
  create(@Body() createHabitLogDto: CreateHabitLogDto) {
    return this.habitLogsService.create(createHabitLogDto);
  }

  @Get()
  findAll() {
    return this.habitLogsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.habitLogsService.findOne(+id);
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
