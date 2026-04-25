import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

/**
 * A single journal entry written by a user. We persist the raw text plus
 * the bilingual sentiment feedback returned by the AI service so users
 * can revisit past entries with their original analysis intact.
 */
@Entity('journal_entries')
export class JournalEntry {
  @PrimaryGeneratedColumn({ name: 'entry_id' })
  entryId!: number;

  @Index()
  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ name: 'content', type: 'text' })
  content!: string;

  // Sentiment score in [-1, 1] from the AI service. Nullable because the
  // AI service may be down when an entry is created — we still want the
  // entry saved.
  @Column({ name: 'sentiment_score', type: 'float', nullable: true })
  sentimentScore!: number | null;

  @Column({ name: 'feedback_english', type: 'text', nullable: true })
  feedbackEnglish!: string | null;

  @Column({ name: 'feedback_urdu', type: 'text', nullable: true })
  feedbackUrdu!: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user!: User;
}
