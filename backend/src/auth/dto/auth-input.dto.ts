import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class AuthInputDto {
  @ApiProperty({ example: 'ada@growflow.app', description: 'Registered email' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;

  @ApiProperty({ example: 'correct horse battery staple', minLength: 1 })
  @IsString()
  @IsNotEmpty({ message: 'password is required' })
  password!: string;
}
