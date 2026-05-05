import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

export type ReminderType = 'task' | 'mood' | 'habit' | 'custom';

@Entity('reminders')
export class Reminder {
  @PrimaryGeneratedColumn({ name: 'reminder_id' })
  reminderId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column()
  title: string;

  @Column({ nullable: true })
  message: string;

  @Column({ type: 'varchar', default: 'custom' })
  type: ReminderType;

  @Column({ name: 'scheduled_for', type: 'timestamptz', nullable: true })
  scheduledFor: Date | null;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'reference_id', nullable: true })
  referenceId: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
