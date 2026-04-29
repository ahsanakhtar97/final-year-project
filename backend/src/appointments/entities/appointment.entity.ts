import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { AppointmentStatus } from '../enums/appointment-status.enum';

/**
 * One appointment request between a patient and a mental-health professional.
 * Lifecycle: pending -> (confirmed | declined) -> (completed | cancelled).
 *
 * Patients create the row; professionals can update status / propose a new
 * time. Both sides can cancel a confirmed appointment.
 */
@Entity('appointments')
export class Appointment {
  @PrimaryGeneratedColumn({ name: 'appointment_id' })
  appointmentId!: number;

  @Index()
  @Column({ name: 'patient_id' })
  patientId!: number;

  @Index()
  @Column({ name: 'professional_id' })
  professionalId!: number;

  @Column({ name: 'proposed_at', type: 'timestamptz' })
  proposedAt!: Date;

  @Column({ name: 'duration_minutes', type: 'int', default: 50 })
  durationMinutes!: number;

  @Column({
    name: 'status',
    type: 'enum',
    enum: AppointmentStatus,
    default: AppointmentStatus.PENDING,
  })
  status!: AppointmentStatus;

  @Column({ name: 'patient_note', type: 'text', nullable: true })
  patientNote!: string | null;

  @Column({ name: 'professional_note', type: 'text', nullable: true })
  professionalNote!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'patient_id' })
  patient!: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'professional_id' })
  professional!: User;
}
