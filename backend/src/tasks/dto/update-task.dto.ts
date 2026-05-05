import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum, IsISO8601, IsOptional,
  IsString, MaxLength, MinLength,
} from 'class-validator';
import { TaskPriority } from '../enums/task-priority.enum';

export class UpdateTaskDto {
  @ApiPropertyOptional({ example: 'Updated title', minLength: 1, maxLength: 200 })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description.', maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:00.000Z' })
  @IsOptional()
  @IsISO8601()
  dueDate?: string | null;
}
