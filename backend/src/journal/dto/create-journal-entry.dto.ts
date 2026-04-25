import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateJournalEntryDto {
  @ApiProperty({ example: 42 })
  @IsInt()
  @IsPositive()
  userId!: number;

  @ApiProperty({
    example: 'Today I felt productive and centered.',
    minLength: 1,
    maxLength: 5000,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  content!: string;

  // When true (default), the entry is run through the sentiment analyzer
  // and the bilingual feedback + score are stored alongside the text.
  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  analyze?: boolean;
}
