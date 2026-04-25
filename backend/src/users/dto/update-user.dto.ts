import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Ada Lovelace' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name?: string;

  @ApiPropertyOptional({ example: 'ada@growflow.app' })
  @IsOptional()
  @IsEmail()
  @MaxLength(120)
  email?: string;

  @ApiPropertyOptional({
    description:
      'New password — must be 8+ characters with a letter and a number.',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'password must contain at least one letter and one number',
  })
  password?: string;

  @ApiPropertyOptional({ description: 'Must match `password` when provided.' })
  // Only require confirmPassword when password is being changed.
  @ValidateIf((o: UpdateUserDto) => o.password !== undefined)
  @IsString()
  @MinLength(8)
  confirmPassword?: string;
}
