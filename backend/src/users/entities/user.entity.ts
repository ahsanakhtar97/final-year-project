import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Task } from '../../tasks/entities/task.entity';
import { UserHabit } from '../../user-habits/entities/user-habit.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId!: number;

  @Column({ name: 'name' })
  name!: string;

  @Index({ unique: true })
  @Column({ name: 'email', unique: true })
  email!: string;

  /**
   * bcrypt hash — never returned to clients. `@Exclude()` is honoured by the
   * global ClassSerializerInterceptor registered in main.ts.
   */
  @Exclude({ toPlainOnly: true })
  @Column({ name: 'password_hash' })
  password!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @OneToMany(() => Task, (task) => task.user)
  tasks!: Task[];

  @OneToMany(() => UserHabit, (userhabit) => userhabit.user)
  userHabits!: UserHabit[];
}
