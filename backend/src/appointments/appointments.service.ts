import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../users/entities/user.entity';
import { isProfessional, UserRole } from '../users/enums/user-role.enum';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment } from './entities/appointment.entity';
import { AppointmentStatus } from './enums/appointment-status.enum';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  /**
   * Patient creates a request. We verify the target user is actually a
   * professional before persisting -- saves us a class of bad data.
   */
  async create(patientId: number, dto: CreateAppointmentDto): Promise<Appointment> {
    if (patientId === dto.professionalId) {
      throw new BadRequestException('You cannot book an appointment with yourself.');
    }
    const target = await this.userRepo.findOne({
      where: { userId: dto.professionalId },
    });
    if (!target) throw new NotFoundException('Professional not found');
    if (!isProfessional(target.role)) {
      throw new BadRequestException(
        'The selected user is not a registered professional.',
      );
    }

    const proposed = new Date(dto.proposedAt);
    if (Number.isNaN(proposed.getTime())) {
      throw new BadRequestException('Invalid proposed date');
    }
    if (proposed.getTime() < Date.now() - 60_000) {
      throw new BadRequestException('Cannot book an appointment in the past');
    }

    const appt = this.repo.create({
      patientId,
      professionalId: dto.professionalId,
      proposedAt: proposed,
      durationMinutes: dto.durationMinutes ?? 50,
      status: AppointmentStatus.PENDING,
      patientNote: dto.patientNote ?? null,
    });
    return this.repo.save(appt);
  }

  /** All appointments where the user is patient OR professional. */
  async findForUser(userId: number, role: UserRole): Promise<Appointment[]> {
    const where = isProfessional(role) ? { professionalId: userId } : { patientId: userId };
    return this.repo.find({
      where,
      relations: ['patient', 'professional'],
      order: { proposedAt: 'ASC' },
    });
  }

  async findOne(id: number, requesterId: number): Promise<Appointment> {
    const appt = await this.repo.findOne({
      where: { appointmentId: id },
      relations: ['patient', 'professional'],
    });
    if (!appt) throw new NotFoundException('Appointment not found');
    if (appt.patientId !== requesterId && appt.professionalId !== requesterId) {
      throw new ForbiddenException('Not your appointment.');
    }
    return appt;
  }

  /**
   * Update flow:
   *  - Professional can: confirm, decline, complete, reschedule, set notes.
   *  - Patient can:      cancel, reschedule (which moves it back to pending).
   */
  async update(
    id: number,
    requesterId: number,
    requesterRole: UserRole,
    dto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const appt = await this.findOne(id, requesterId);
    const isPro = appt.professionalId === requesterId && isProfessional(requesterRole);
    const isPatient = appt.patientId === requesterId;

    if (dto.status !== undefined) {
      const proAllowed = [
        AppointmentStatus.CONFIRMED,
        AppointmentStatus.DECLINED,
        AppointmentStatus.COMPLETED,
        AppointmentStatus.CANCELLED,
      ];
      const patientAllowed = [AppointmentStatus.CANCELLED];
      const allowed = isPro ? proAllowed : isPatient ? patientAllowed : [];
      if (!allowed.includes(dto.status)) {
        throw new ForbiddenException(
          `You can't change the status to "${dto.status}" on this appointment.`,
        );
      }
      appt.status = dto.status;
    }

    if (dto.proposedAt !== undefined) {
      const proposed = new Date(dto.proposedAt);
      if (Number.isNaN(proposed.getTime())) {
        throw new BadRequestException('Invalid proposed date');
      }
      appt.proposedAt = proposed;
      // Re-propose returns the row to PENDING so the other side can re-confirm.
      if (dto.status === undefined) appt.status = AppointmentStatus.PENDING;
    }

    if (dto.professionalNote !== undefined) {
      if (!isPro) throw new ForbiddenException('Only the professional can add a note.');
      appt.professionalNote = dto.professionalNote;
    }

    return this.repo.save(appt);
  }

  async remove(id: number, requesterId: number): Promise<{ message: string }> {
    const appt = await this.findOne(id, requesterId);
    await this.repo.delete({ appointmentId: appt.appointmentId });
    return { message: 'Appointment removed' };
  }
}
