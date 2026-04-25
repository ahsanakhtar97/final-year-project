import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  Max,
  Min,
} from 'class-validator';

import { HabitStatus } from '../enums/habit-status.enum';

export class CreateHabitLogDto {
  @ApiProperty({ example: 12, description: 'FK — user_habits.user_habit_id' })
  @IsInt()
  @IsPositive()
  userHabitId!: number;

  @ApiProperty({ example: '2026-04-25', description: 'ISO date (YYYY-MM-DD).' })
  @IsDateString()
  date!: string;

  @ApiPropertyOptional({ enum: HabitStatus, default: HabitStatus.COMPLETED })
  @IsOptional()
  @IsEnum(HabitStatus)
  status?: HabitStatus;

  @ApiPropertyOptional({ example: 7, minimum: 1, maximum: 10, default: 5 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  moodScore?: number;
}
