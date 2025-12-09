import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { HabitsService } from './habits.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { Habit } from './entities/habit.entity';
import { Category } from 'src/categories/entities/category.entity';

@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Post()
  async create(@Body() createHabitDto: CreateHabitDto):Promise<string> {
    return await this.habitsService.create(createHabitDto);
  }

  @Get()
  async findAll():Promise<Habit[]> {
    return await this.habitsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number):Promise<Habit|null> {
    return await this.habitsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateHabitDto: UpdateHabitDto) {
    return this.habitsService.update(+id, updateHabitDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number):Promise<string> {
    return await this.habitsService.remove(id);
  }
  @Get(':id/category')
  async getCategory(@Param('id') habitId:number):Promise<Category>{
    return await this.habitsService.getcategory(habitId);
  }
}
