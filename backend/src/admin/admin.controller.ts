import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ILike, In, Repository } from 'typeorm';

import { Appointment } from '../appointments/entities/appointment.entity';
import { User } from '../users/entities/user.entity';
import { PROFESSIONAL_ROLES, UserRole } from '../users/enums/user-role.enum';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';

class VerifyDto {
  @IsBoolean()
  verified!: boolean;
}

class UpdateUserAdminDto {
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsBoolean()
  verified?: boolean;
}

class AdminQueryDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  page?: string;

  @IsOptional()
  limit?: string;
}

/**
 * Admin-only endpoints, protected by JWT + RolesGuard.
 * The requesting user must have role='admin' in their JWT.
 *
 * To bootstrap your first admin account, register normally then run:
 *   UPDATE users SET role='admin' WHERE email='your@email.com';
 */
@ApiTags('admin')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@Controller({ path: 'admin', version: '1' })
export class AdminController {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Appointment)
    private readonly apptRepo: Repository<Appointment>,
  ) {}

  // ─── Platform Stats ────────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Platform-wide statistics.' })
  async stats() {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      patients,
      psychiatrists,
      psychologists,
      adminCount,
      verifiedDoctors,
      pendingVerification,
      totalAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      declinedAppointments,
      newSignups7Days,
    ] = await Promise.all([
      this.userRepo.count(),
      this.userRepo.count({ where: { role: UserRole.PATIENT } }),
      this.userRepo.count({ where: { role: UserRole.PSYCHIATRIST } }),
      this.userRepo.count({ where: { role: UserRole.PSYCHOLOGIST } }),
      this.userRepo.count({ where: { role: UserRole.ADMIN } }),
      this.userRepo.count({
        where: {
          role: In(PROFESSIONAL_ROLES as unknown as UserRole[]),
          verified: true,
        },
      }),
      this.userRepo.count({
        where: {
          role: In(PROFESSIONAL_ROLES as unknown as UserRole[]),
          verified: false,
        },
      }),
      this.apptRepo.count(),
      this.apptRepo.count({ where: { status: 'pending' as any } }),
      this.apptRepo.count({ where: { status: 'confirmed' as any } }),
      this.apptRepo.count({ where: { status: 'completed' as any } }),
      this.apptRepo.count({ where: { status: 'cancelled' as any } }),
      this.apptRepo.count({ where: { status: 'declined' as any } }),
      this.userRepo
        .createQueryBuilder('u')
        .where('u.created_at >= :date', { date: sevenDaysAgo })
        .getCount(),
    ]);

    return {
      users: { total: totalUsers, patients, psychiatrists, psychologists, admins: adminCount },
      doctors: { verified: verifiedDoctors, pendingVerification },
      appointments: {
        total: totalAppointments,
        pending: pendingAppointments,
        confirmed: confirmedAppointments,
        completed: completedAppointments,
        cancelled: cancelledAppointments,
        declined: declinedAppointments,
      },
      growth: { newSignups7Days },
    };
  }

  // ─── User Management ───────────────────────────────────────────────────────

  @Get('users')
  @ApiOperation({ summary: 'List all users with optional search/filter/pagination.' })
  async listUsers(@Query() q: AdminQueryDto) {
    const page = Math.max(1, parseInt(q.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(q.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const whereBase: any = {};
    if (q.role) whereBase.role = q.role as UserRole;

    const where = q.search
      ? [
          { ...whereBase, name: ILike(`%${q.search}%`) },
          { ...whereBase, email: ILike(`%${q.search}%`) },
        ]
      : whereBase;

    const [users, total] = await this.userRepo.findAndCount({
      where,
      select: [
        'userId', 'name', 'email', 'role', 'verified',
        'xp', 'level', 'createdAt', 'credentials', 'yearsExperience',
      ],
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { users, total, page, limit, pages: Math.ceil(total / limit) };
  }

  @Patch('users/:id')
  @ApiOperation({ summary: "Update a user's role or verified flag." })
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserAdminDto,
  ) {
    const user = await this.userRepo.findOne({ where: { userId: id } });
    if (!user) throw new NotFoundException('User not found');

    if (dto.role !== undefined) user.role = dto.role;
    if (dto.verified !== undefined) user.verified = dto.verified;

    await this.userRepo.save(user);
    return { userId: user.userId, name: user.name, email: user.email, role: user.role, verified: user.verified };
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Permanently delete a user account.' })
  async deleteUser(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userRepo.findOne({ where: { userId: id } });
    if (!user) throw new NotFoundException('User not found');
    await this.userRepo.delete({ userId: id });
    return { message: `User ${user.name} (${user.email}) deleted.` };
  }

  // ─── Doctor Verification ───────────────────────────────────────────────────

  @Get('professionals')
  @ApiOperation({ summary: 'List all professionals + their verification state.' })
  listProfessionals() {
    return this.userRepo.find({
      where: { role: In(PROFESSIONAL_ROLES as unknown as UserRole[]) },
      order: { createdAt: 'DESC' },
      select: [
        'userId', 'name', 'email', 'role', 'credentials',
        'yearsExperience', 'bio', 'languages', 'feeText', 'verified', 'createdAt',
      ],
    });
  }

  @Patch('professionals/:id/verify')
  @ApiOperation({ summary: 'Approve or revoke verification for a professional.' })
  async verifyProfessional(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VerifyDto,
  ) {
    const user = await this.userRepo.findOne({ where: { userId: id } });
    if (!user) throw new NotFoundException('User not found');
    user.verified = dto.verified;
    await this.userRepo.save(user);
    return {
      userId: user.userId,
      name: user.name,
      verified: user.verified,
      message: dto.verified ? 'Professional verified.' : 'Verification revoked.',
    };
  }

  // ─── Appointments ──────────────────────────────────────────────────────────

  @Get('appointments')
  @ApiOperation({ summary: 'List all appointments across the platform.' })
  async listAppointments(@Query() q: AdminQueryDto) {
    const page = Math.max(1, parseInt(q.page ?? '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(q.limit ?? '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (q.status) where.status = q.status;

    const [appointments, total] = await this.apptRepo.findAndCount({
      where,
      relations: ['patient', 'professional'],
      order: { proposedAt: 'DESC' },
      skip,
      take: limit,
    });

    return { appointments, total, page, limit, pages: Math.ceil(total / limit) };
  }

  @Delete('appointments/:id')
  @ApiOperation({ summary: 'Force-delete an appointment.' })
  async deleteAppointment(@Param('id', ParseIntPipe) id: number) {
    const appt = await this.apptRepo.findOne({ where: { appointmentId: id } });
    if (!appt) throw new NotFoundException('Appointment not found');
    await this.apptRepo.delete({ appointmentId: id });
    return { message: `Appointment #${id} deleted.` };
  }
}
