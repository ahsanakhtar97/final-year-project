import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpsertMoodLogDto {
  @ApiProperty({ example: '2025-05-05', description: 'YYYY-MM-DD date for this check-in.' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 4, description: 'Mood score 1 (very low) to 5 (excellent).' })
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @ApiPropertyOptional({
    example: ['anxious', 'grateful'],
    description: 'Emotion tags from the predefined list.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  emotionTags?: string[];

  @ApiPropertyOptional({ example: 'Felt stressed in the morning but better by evening.' })
  @IsOptional()
  @IsString()
  note?: string;
}
