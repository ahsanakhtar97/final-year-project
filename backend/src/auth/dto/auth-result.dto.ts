import { ApiProperty } from '@nestjs/swagger';

export class AuthResultDto {
  @ApiProperty({ description: 'Signed JWT — include as `Bearer <token>` header.' })
  accessToken!: string;

  @ApiProperty({ example: 42 })
  userId!: number;

  @ApiProperty({ example: 'Ada Lovelace' })
  name!: string;

  @ApiProperty({ example: 'ada@growflow.app' })
  email!: string;
}
