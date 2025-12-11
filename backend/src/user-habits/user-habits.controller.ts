import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { UserHabitsService } from './user-habits.service';
import { CreateUserHabitDto } from './dto/create-user-habit.dto';
import { UpdateUserHabitDto } from './dto/update-user-habit.dto';
import { UserHabit } from './entities/user-habit.entity';
import { Habit } from 'src/habits/entities/habit.entity';

@Controller('user-habits')
export class UserHabitsController {
  constructor(private readonly userHabitsService: UserHabitsService) { }

  @Post()
  async assignHabit(@Body() createUserHabitDto: CreateUserHabitDto) {
    return this.userHabitsService.assignHabit(createUserHabitDto);
  }

  @Get()
  async findAll(): Promise<UserHabit[]> {
    return await this.userHabitsService.findAll();
  }

  @Get('user/:userId/habit/:habitId')
  async findUserHabit(@Param('userId') userId:number,@Param('habitId') habitId:number) {
    return await this.userHabitsService.findUserHabit(userId,habitId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserHabitDto: UpdateUserHabitDto) {
    return this.userHabitsService.update(+id, updateUserHabitDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userHabitsService.remove(+id);
  }
  @Get('user/:id')
  async findHabitsByUserId(@Param('id') userId: number): Promise<Habit[]> {
    return await this.userHabitsService.findHabitsByUserId(userId);
  }

  @Get('logs/last7days/:userId')
  async getCompletedLast7Days(@Param('userId') userId: number): Promise<any> {
    return await this.userHabitsService.getCompletedLast7Days(userId);
  }

  @Get('user/:id/stats')
  async getHabitStats(@Param('id') userId: number, @Query('days') days = 30) {
    return await this.userHabitsService.getHabitStats(userId, days);
  }

  @Get('user/:id/stats/best-worst')
  async getBestWorstHabit(@Param('id') userId: number, @Query('days') days = 30) {
    return await this.userHabitsService.getBestWorstHabit(userId, days);
  }

  @Get('user/:id/stats/streaks')
  async getHabitStreaks(@Param('id') userId: number) {
    return await this.userHabitsService.getHabitStreaks(userId);
  }

  @Get('user/:userId/completed/:days')
  async getCompletedHabitsDaily(
    @Param('userId') userId: number,
    @Param('days') days: number
  ) {
    return await this.userHabitsService.getCompletedHabitsDaily(userId, days);
  }

  @Delete('user/:userId/habit/:habitId')
  async revokeHabit(@Param('userId') userId:number,@Param('habitId') habitId:number):Promise<string>{
    return await this.userHabitsService.revokeHabit(userId,habitId);
  }


}
