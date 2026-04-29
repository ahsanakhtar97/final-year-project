import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

/**
 * One sleep record per user per night. The (user_id, date) tuple is unique
 * so a re-submit for the same date upserts cleanly via the service.
 */
@Entity('sleep_logs')
@Unique('uniq_user_sleep_per_day', ['userId', 'date'])
export class SleepLog {
  @PrimaryGeneratedColumn({ name: 'sleep_log_id' })
  sleepLogId!: number;

  @Index()
  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ name: 'date', type: 'date' })
  date!: string; // YYYY-MM-DD, the night the user woke up FROM

  @Column({ name: 'hours', type: 'decimal', precision: 4, scale: 2 })
  hours!: number;

  /** 1-5 self-rated sleep quality. */
  @Column({ name: 'quality', type: 'int' })
  quality!: number;

  @Column({ name: 'note', type: 'text', nullable: true })
  note!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
