import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty({ example: 'Ada Lovelace' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  name!: string;

  @ApiProperty({ example: 'ada@growflow.app' })
  @IsEmail()
  @MaxLength(120)
  email!: string;

  @ApiProperty({ example: 'hashed-password-or-plain', minLength: 8 })
  @IsString()
  password!: string;

  @ApiProperty({ enum: UserRole, default: UserRole.PATIENT, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ required: false, maxLength: 2000 })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string;

  @ApiProperty({ required: false, maxLength: 200, example: 'MBBS, FCPS (Psychiatry)' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  credentials?: string;

  @ApiProperty({ required: false, maxLength: 200, example: 'English, Urdu' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  languages?: string;

  @ApiProperty({ required: false, maxLength: 80, example: 'PKR 5,000 / session' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  feeText?: string;

  @ApiProperty({ required: false, minimum: 0, maximum: 80 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(80)
  yearsExperience?: number;
}
