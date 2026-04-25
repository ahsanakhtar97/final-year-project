import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { UserHabit } from 'src/user-habits/entities/user-habit.entity';

@Entity('habit_logs')
export class HabitLog {
  @PrimaryGeneratedColumn()
  logId: number;

  // Ensure this relation name matches what you use in create()
  @ManyToOne(() => UserHabit, (userHabit) => userHabit.habitLogs) // Change .logs to .habitLogs
  userHabit: UserHabit;

  @Column({ type: 'date' })
  date: string; // The YYYY-MM-DD from frontend

  @Column({ default: 'completed' })
  status: string;

  @Column({ type: 'int', default: 5 })
  moodScore: number;

  @CreateDateColumn()
  createdAt: Date; // The timestamp of when the row was made
}