import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from 'src/users/entities/user.entity';
import { GoalStatus } from '../enums/goal-status.enum';

/**
 * A high-level objective the user is working toward (e.g. "Run a 5K", "Read 12
 * books"). Goals are intentionally generic -- they don't have to link to a
 * specific habit, but they CAN, in which case we surface joint progress.
 */
@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn({ name: 'goal_id' })
  goalId: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'title' })
  title: string;

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null;

  @Column({ name: 'target_value', type: 'int', default: 1 })
  targetValue: number;

  @Column({ name: 'current_value', type: 'int', default: 0 })
  currentValue: number;

  @Column({ name: 'unit', type: 'varchar', length: 30, nullable: true })
  unit: string | null;

  @Column({
    name: 'status',
    type: 'enum',
    enum: GoalStatus,
    default: GoalStatus.ACTIVE,
  })
  status: GoalStatus;

  @Column({ name: 'deadline', type: 'date', nullable: true })
  deadline: Date | null;

  @Column({ name: 'linked_habit_id', type: 'int', nullable: true })
  linkedHabitId: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
