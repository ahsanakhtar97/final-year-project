import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'Ada Lovelace' })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 'ada@growflow.app' })
  @IsEmail()
  @MaxLength(120)
  email!: string;

  @ApiProperty({ example: '<bcrypt hash>', description: 'Pre-hashed password.' })
  @IsString()
  @MinLength(8)
  password!: string;
}
