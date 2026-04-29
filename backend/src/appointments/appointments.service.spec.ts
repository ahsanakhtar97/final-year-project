import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { AppointmentsService } from './appointments.service';
import { Appointment } from './entities/appointment.entity';
import { AppointmentStatus } from './enums/appointment-status.enum';

/**
 * Tests focus on the role-permission matrix in update() because it's the
 * one place real user input reaches a status machine. The DB is mocked --
 * we're testing service logic, not TypeORM.
 */

const realDate = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * 24 * 3600 * 1000);

function makeAppt(overrides: Partial<Appointment> = {}): Appointment {
  return {
    appointmentId: 1,
    patientId: 100,
    professionalId: 200,
    proposedAt: realDate(2),
    durationMinutes: 50,
    status: AppointmentStatus.PENDING,
    patientNote: null,
    professionalNote: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    patient: { userId: 100 } as User,
    professional: { userId: 200 } as User,
    ...overrides,
  } as Appointment;
}

describe('AppointmentsService', () => {
  let svc: AppointmentsService;
  let apptRepo: { findOne: jest.Mock; find: jest.Mock; save: jest.Mock; create: jest.Mock; delete: jest.Mock; manager?: unknown };
  let userRepo: { findOne: jest.Mock };

  beforeEach(async () => {
    apptRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn((x) => Promise.resolve(x)),
      create: jest.fn((x) => x),
      delete: jest.fn(() => Promise.resolve({ affected: 1 })),
    };
    userRepo = { findOne: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AppointmentsService,
        { provide: getRepositoryToken(Appointment), useValue: apptRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    svc = moduleRef.get(AppointmentsService);
  });

  describe('create', () => {
    it('refuses booking yourself', async () => {
      await expect(
        svc.create(100, {
          professionalId: 100,
          proposedAt: realDate(1).toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('404s when professional does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(
        svc.create(100, {
          professionalId: 999,
          proposedAt: realDate(1).toISOString(),
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('refuses booking a non-professional account', async () => {
      userRepo.findOne.mockResolvedValue({
        userId: 200,
        role: UserRole.PATIENT,
      } as User);
      await expect(
        svc.create(100, {
          professionalId: 200,
          proposedAt: realDate(1).toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('refuses bookings in the past', async () => {
      userRepo.findOne.mockResolvedValue({
        userId: 200,
        role: UserRole.PSYCHIATRIST,
      } as User);
      await expect(
        svc.create(100, {
          professionalId: 200,
          proposedAt: realDate(-2).toISOString(),
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('persists when inputs are valid', async () => {
      userRepo.findOne.mockResolvedValue({
        userId: 200,
        role: UserRole.PSYCHOLOGIST,
      } as User);
      const result = await svc.create(100, {
        professionalId: 200,
        proposedAt: realDate(3).toISOString(),
        patientNote: 'first time',
      });
      expect(apptRepo.save).toHaveBeenCalled();
      expect(result.patientId).toBe(100);
      expect(result.status).toBe(AppointmentStatus.PENDING);
    });
  });

  describe('update permissions', () => {
    it('lets the professional confirm a pending request', async () => {
      apptRepo.findOne.mockResolvedValue(makeAppt());
      const out = await svc.update(1, 200, UserRole.PSYCHIATRIST, {
        status: AppointmentStatus.CONFIRMED,
      });
      expect(out.status).toBe(AppointmentStatus.CONFIRMED);
    });

    it('refuses the patient from setting status to confirmed', async () => {
      apptRepo.findOne.mockResolvedValue(makeAppt());
      await expect(
        svc.update(1, 100, UserRole.PATIENT, {
          status: AppointmentStatus.CONFIRMED,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('lets the patient cancel their own appointment', async () => {
      apptRepo.findOne.mockResolvedValue(makeAppt());
      const out = await svc.update(1, 100, UserRole.PATIENT, {
        status: AppointmentStatus.CANCELLED,
      });
      expect(out.status).toBe(AppointmentStatus.CANCELLED);
    });

    it('refuses notes from anyone but the professional', async () => {
      apptRepo.findOne.mockResolvedValue(makeAppt());
      await expect(
        svc.update(1, 100, UserRole.PATIENT, { professionalNote: 'hi' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('refuses any update from a stranger', async () => {
      apptRepo.findOne.mockResolvedValue(makeAppt());
      await expect(
        svc.update(1, 999, UserRole.PATIENT, {
          status: AppointmentStatus.CANCELLED,
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('reschedule without explicit status moves it back to pending', async () => {
      apptRepo.findOne.mockResolvedValue(
        makeAppt({ status: AppointmentStatus.CONFIRMED }),
      );
      const out = await svc.update(1, 200, UserRole.PSYCHIATRIST, {
        proposedAt: realDate(5).toISOString(),
      });
      expect(out.status).toBe(AppointmentStatus.PENDING);
    });
  });
});
