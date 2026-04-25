import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'Ada Lovelace', minLength: 2, maxLength: 80 })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 'ada@growflow.app' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(120)
  email!: string;

  @ApiProperty({
    example: 'S0mething-stronger',
    minLength: 8,
    maxLength: 128,
    description:
      'Must be 8+ characters and contain at least one letter and one number.',
  })
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters' })
  @MaxLength(128)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'password must contain at least one letter and one number',
  })
  password!: string;
}
