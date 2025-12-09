import { PartialType } from '@nestjs/mapped-types';
import { CreateUserHabitDto } from './create-user-habit.dto';

export class UpdateUserHabitDto extends PartialType(CreateUserHabitDto) {}
