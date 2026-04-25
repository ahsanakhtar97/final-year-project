import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { Habit } from '../habits/entities/habit.entity';
import { CreateUserHabitDto } from './dto/create-user-habit.dto';
import { UserHabit } from './entities/user-habit.entity';
import { UserHabitsService } from './user-habits.service';

@ApiTags('user-habits')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'user-habits', version: '1' })
export class UserHabitsController {
  constructor(private readonly userHabitsService: UserHabitsService) {}

  @Post()
  @ApiOperation({ summary: 'Assign a habit to a user.' })
  assignHabit(@Body() createUserHabitDto: CreateUserHabitDto): Promise<UserHabit> {
    return this.userHabitsService.assignHabit(createUserHabitDto);
  }

  @Get()
  @ApiOperation({ summary: 'List every user-habit row in the system.' })
  findAll(): Promise<UserHabit[]> {
    return this.userHabitsService.findAll();
  }

  @Get('user/:userId/habit/:habitId')
  @ApiOperation({ summary: 'Find the join row for a (user, habit) pair.' })
  findUserHabit(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('habitId', ParseIntPipe) habitId: number,
  ): Promise<UserHabit | null> {
    return this.userHabitsService.findUserHabit(userId, habitId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a user-habit row by id.' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.userHabitsService.remove(id);
  }

  @Get('user/:id')
  @ApiOperation({ summary: "Return all habits the user has been assigned." })
  findHabitsByUserId(@Param('id', ParseIntPipe) userId: number): Promise<Habit[]> {
    return this.userHabitsService.findHabitsByUserId(userId);
  }

  @Get('logs/last7days/:userId')
  @ApiOperation({ summary: 'Return the user’s habit logs for the past 7 days.' })
  getCompletedLast7Days(@Param('userId', ParseIntPipe) userId: number) {
    return this.userHabitsService.getCompletedLast7Days(userId);
  }

  @Get('user/:id/stats')
  @ApiOperation({ summary: 'Per-habit completion percentage over a window of days.' })
  getHabitStats(
    @Param('id', ParseIntPipe) userId: number,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.userHabitsService.getHabitStats(userId, days);
  }

  @Get('user/:id/stats/best-worst')
  @ApiOperation({ summary: 'Pick the user’s best- and worst-performing habits.' })
  getBestWorstHabit(
    @Param('id', ParseIntPipe) userId: number,
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.userHabitsService.getBestWorstHabit(userId, days);
  }

  @Get('user/:id/stats/streaks')
  @ApiOperation({ summary: 'Compute current + longest streak per habit.' })
  getHabitStreaks(@Param('id', ParseIntPipe) userId: number) {
    return this.userHabitsService.getHabitStreaks(userId);
  }

  @Get('user/:userId/completed/:days')
  @ApiOperation({ summary: 'Daily count of completed habits for the past N days.' })
  getCompletedHabitsDaily(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('days', ParseIntPipe) days: number,
  ) {
    return this.userHabitsService.getCompletedHabitsDaily(userId, days);
  }

  @Delete('user/:userId/habit/:habitId')
  @ApiOperation({ summary: 'Revoke an assigned habit from a user.' })
  revokeHabit(
    @Param('userId', ParseIntPipe) userId: number,
    @Param('habitId', ParseIntPipe) habitId: number,
  ): Promise<{ message: string }> {
    return this.userHabitsService.revokeHabit(userId, habitId);
  }
}
