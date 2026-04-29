import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { IsBoolean } from 'class-validator';
import { In, Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { PROFESSIONAL_ROLES, UserRole } from '../users/enums/user-role.enum';
import { AdminGuard } from './admin.guard';

class VerifyDto {
  @IsBoolean()
  verified!: boolean;
}

/**
 * Admin endpoints. Auth is by the AdminGuard (header-token check) -- not the
 * JWT auth used for normal user routes. So any tool that can set headers
 * (curl, Postman, an admin script) can call these as long as it knows the
 * ADMIN_TOKEN value.
 */
@ApiTags('admin')
@UseGuards(AdminGuard)
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) {}

  @Get('professionals')
  @ApiOperation({ summary: 'List all professionals + their verification state.' })
  list() {
    return this.userRepo.find({
      where: { role: In(PROFESSIONAL_ROLES as unknown as UserRole[]) },
      order: { createdAt: 'DESC' },
      select: [
        'userId',
        'name',
        'email',
        'role',
        'credentials',
        'yearsExperience',
        'verified',
        'createdAt',
      ],
    });
  }

  @Patch('professionals/:id/verify')
  @ApiOperation({ summary: 'Flip the verified flag on a professional account.' })
  async verify(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VerifyDto,
  ) {
    const user = await this.userRepo.findOne({ where: { userId: id } });
    if (!user) throw new NotFoundException('User not found');
    user.verified = dto.verified;
    await this.userRepo.save(user);
    return {
      userId: user.userId,
      verified: user.verified,
      message: dto.verified ? 'Marked verified.' : 'Verification revoked.',
    };
  }
}
