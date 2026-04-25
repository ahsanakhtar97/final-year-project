import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Category } from '../categories/entities/category.entity';
import { Habit } from './entities/habit.entity';
import { HabitsController } from './habits.controller';
import { HabitsSeedService } from './habits.seed';
import { HabitsService } from './habits.service';

@Module({
  imports: [TypeOrmModule.forFeature([Habit, Category])],
  controllers: [HabitsController],
  providers: [HabitsService, HabitsSeedService],
  exports: [HabitsService],
})
export class HabitsModule {}
