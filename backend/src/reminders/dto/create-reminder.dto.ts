import { IsDateString, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateReminderDto {
  @IsNumber()
  userId: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  message?: string;

  @IsIn(['task', 'mood', 'habit', 'custom'])
  @IsOptional()
  type?: 'task' | 'mood' | 'habit' | 'custom';

  @IsDateString()
  @IsOptional()
  scheduledFor?: string;

  @IsNumber()
  @IsOptional()
  referenceId?: number;
}
