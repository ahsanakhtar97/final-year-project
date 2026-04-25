import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { Category } from '../categories/entities/category.entity';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { Habit } from './entities/habit.entity';
import { HabitsService } from './habits.service';

@ApiTags('habits')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'habits', version: '1' })
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new habit (template, not user-specific).' })
  create(@Body() createHabitDto: CreateHabitDto): Promise<Habit> {
    return this.habitsService.create(createHabitDto);
  }

  @Get()
  @ApiOperation({ summary: 'List every habit.' })
  findAll(): Promise<Habit[]> {
    return this.habitsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a single habit.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Habit> {
    return this.habitsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a habit’s name or category.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHabitDto: UpdateHabitDto,
  ): Promise<Habit> {
    return this.habitsService.update(id, updateHabitDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a habit.' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.habitsService.remove(id);
  }

  @Get(':id/category')
  @ApiOperation({ summary: 'Return the category this habit belongs to.' })
  getCategory(@Param('id', ParseIntPipe) habitId: number): Promise<Category> {
    return this.habitsService.getCategory(habitId);
  }
}
