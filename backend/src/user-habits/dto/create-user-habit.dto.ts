import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CreateUserHabitDto {
  @ApiProperty({ example: 42 })
  @IsInt()
  @IsPositive()
  userId!: number;

  @ApiProperty({ example: 7 })
  @IsInt()
  @IsPositive()
  habitId!: number;
}
