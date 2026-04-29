import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpsertSleepLogDto {
  @ApiProperty({ example: '2026-04-28', description: 'YYYY-MM-DD' })
  @IsDateString()
  date!: string;

  @ApiProperty({ example: 7.5, minimum: 0, maximum: 24 })
  @IsNumber()
  @Min(0)
  @Max(24)
  hours!: number;

  @ApiProperty({ example: 4, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  quality!: number;

  @ApiProperty({ required: false, maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
