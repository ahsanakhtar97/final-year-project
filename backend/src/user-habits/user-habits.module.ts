import { Module } from '@nestjs/common';
import { UserHabitsService } from './user-habits.service';
import { UserHabitsController } from './user-habits.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserHabit } from './entities/user-habit.entity';

@Module({
  imports:[TypeOrmModule.forFeature([UserHabit])],
  controllers: [UserHabitsController],
  providers: [UserHabitsService],
})
export class UserHabitsModule {}
