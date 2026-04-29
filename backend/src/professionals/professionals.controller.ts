import {
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { PROFESSIONAL_ROLES, UserRole } from '../users/enums/user-role.enum';

@ApiTags('professionals')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'professionals', version: '1' })
export class ProfessionalsController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all registered psychiatrists / psychologists.' })
  @ApiQuery({ name: 'role', required: false, enum: UserRole })
  async list(@Query('role') role?: UserRole) {
    const where = role && PROFESSIONAL_ROLES.includes(role as never)
      ? { role }
      : { role: In(PROFESSIONAL_ROLES as unknown as UserRole[]) };
    const rows = await this.userRepo.find({
      where,
      order: { name: 'ASC' },
    });
    return rows.map(this.toPublic);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a professional public profile.' })
  async getOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userRepo.findOne({ where: { userId: id } });
    if (!user) throw new NotFoundException('Professional not found');
    if (!PROFESSIONAL_ROLES.includes(user.role as never)) {
      throw new NotFoundException('Professional not found');
    }
    return this.toPublic(user);
  }

  /** Strip private fields. The serializer also excludes `password` via @Exclude. */
  private toPublic(u: User) {
    return {
      userId: u.userId,
      name: u.name,
      role: u.role,
      bio: u.bio,
      credentials: u.credentials,
      languages: u.languages,
      feeText: u.feeText,
      yearsExperience: u.yearsExperience,
      verified: u.verified ?? false,
      email: u.email, // public so patients can reach out off-platform too
    };
  }
}
