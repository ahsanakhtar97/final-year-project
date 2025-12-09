import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { UserHabitsService } from './user-habits.service';
import { CreateUserHabitDto } from './dto/create-user-habit.dto';
import { UpdateUserHabitDto } from './dto/update-user-habit.dto';
import { UserHabit } from './entities/user-habit.entity';

@Controller('user-habits')
export class UserHabitsController {
  constructor(private readonly userHabitsService: UserHabitsService) {}

  @Post()
  async assignHabit(@Body() createUserHabitDto: CreateUserHabitDto) {
    return this.userHabitsService.assignHabit(createUserHabitDto);
  }

  @Get()
  async findAll():Promise<UserHabit[]> {
    return await this.userHabitsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userHabitsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserHabitDto: UpdateUserHabitDto) {
    return this.userHabitsService.update(+id, updateUserHabitDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userHabitsService.remove(+id);
  }
}
