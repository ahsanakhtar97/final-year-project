import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateHabitDto {
  @ApiProperty({ example: 'Morning meditation', minLength: 1, maxLength: 120 })
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  habitName!: string;

  @ApiProperty({ example: 3, description: 'Foreign key — categories.category_id' })
  @IsInt()
  @IsPositive()
  categoryId!: number;
}
