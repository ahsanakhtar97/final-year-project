import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateAppointmentDto {
  @ApiProperty({ example: 17, description: 'User ID of the professional being booked.' })
  @IsInt()
  @IsPositive()
  professionalId!: number;

  @ApiProperty({
    example: '2026-05-04T15:30:00.000Z',
    description: 'Proposed appointment time, ISO 8601.',
  })
  @IsDateString()
  proposedAt!: string;

  @ApiProperty({ required: false, example: 50, default: 50 })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(180)
  durationMinutes?: number;

  @ApiProperty({ required: false, maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  patientNote?: string;
}
