import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Context the frontend gathers and sends along with a coach prompt. Keeping
 * this on the request keeps the endpoint stateless -- the dashboard already
 * fetched these values for its own UI, so we just forward them rather than
 * re-querying the DB on every coach interaction.
 */
export class CoachContextDto {
  @ApiPropertyOptional({ example: 5, description: 'Tasks the user still has to do' })
  @IsOptional()
  @IsInt()
  @Min(0)
  openTasks?: number;

  @ApiPropertyOptional({ example: 12, description: 'Tasks completed in the last 7 days' })
  @IsOptional()
  @IsInt()
  @Min(0)
  tasksCompleted7d?: number;

  @ApiPropertyOptional({
    example: 6.4,
    description: 'Average mood (0-10) over the last 7 days; null if no entries',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  recentMoodAvg?: number;

  @ApiPropertyOptional({ example: 9 })
  @IsOptional()
  @IsInt()
  @Min(0)
  bestStreak?: number;

  @ApiPropertyOptional({ example: 25 })
  @IsOptional()
  @IsInt()
  @Min(0)
  focusMinutesToday?: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  @Min(0)
  habitsDoneToday?: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  @Min(0)
  habitsTotalToday?: number;
}

export class CoachRequestDto {
  @ApiPropertyOptional({
    example: 'Feeling stuck on my reading goal',
    description: 'Optional free-text the user typed',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string;

  @ApiProperty({ type: () => CoachContextDto })
  @ValidateNested()
  @Type(() => CoachContextDto)
  context!: CoachContextDto;
}
