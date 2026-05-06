import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString, ValidateNested } from 'class-validator';

export class DayDataDto {
  @IsString()
  date: string;

  @IsNumber()
  habitsCompleted: number;

  @IsNumber()
  @IsOptional()
  moodScore: number | null;

  @IsNumber()
  @IsOptional()
  sleepHours: number | null;

  @IsNumber()
  tasksCompleted: number;
}

export class CorrelationsRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DayDataDto)
  days: DayDataDto[];

  @IsNumber()
  totalHabitLogs: number;

  @IsNumber()
  totalJournalEntries: number;
}
