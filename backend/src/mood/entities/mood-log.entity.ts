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
 * One mood check-in per user per day.
 * The (user_id, date) pair is unique so re-submitting the same day upserts.
 */
@Entity('mood_logs')
@Unique('uniq_user_mood_per_day', ['userId', 'date'])
export class MoodLog {
  @PrimaryGeneratedColumn({ name: 'mood_log_id' })
  moodLogId!: number;

  @Index()
  @Column({ name: 'user_id' })
  userId!: number;

  /** YYYY-MM-DD — the calendar day this check-in belongs to. */
  @Column({ name: 'date', type: 'date' })
  date!: string;

  /** 1 (very low) → 5 (excellent). */
  @Column({ name: 'score', type: 'int' })
  score!: number;

  /**
   * Comma-separated emotion tags, e.g. "anxious,tired".
   * TypeORM simple-array stores as a single VARCHAR — no JSON overhead.
   */
  @Column({ name: 'emotion_tags', type: 'simple-array', nullable: true })
  emotionTags!: string[] | null;

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
