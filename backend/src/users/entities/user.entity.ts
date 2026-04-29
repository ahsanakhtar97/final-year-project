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
import { UserRole } from '../enums/user-role.enum';
import { UserBadge } from '../../gamification/entities/user-badge.entity';
import { Report } from '../../reports/entities/report.entity';
import { BuddyConnection } from '../../buddies/entities/buddy-connection.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ name: 'user_id' })
  userId!: number;

  @Column({ name: 'name' })
  name!: string;

  @Index({ unique: true })
  @Column({ name: 'email', unique: true })
  email!: string;

  @Exclude({ toPlainOnly: true })
  @Column({ name: 'password_hash' })
  password!: string;

  /**
   * Role discriminator. Default PATIENT for backward compatibility -- existing
   * rows migrate cleanly because the DB default is also patient.
   */
  @Column({
    name: 'role',
    type: 'enum',
    enum: UserRole,
    default: UserRole.PATIENT,
  })
  role!: UserRole;

  // ---- Professional profile fields (only meaningful when role != patient) ----
  @Column({ name: 'bio', type: 'text', nullable: true })
  bio!: string | null;

  @Column({ name: 'credentials', type: 'varchar', length: 200, nullable: true })
  credentials!: string | null;

  @Column({ name: 'languages', type: 'varchar', length: 200, nullable: true })
  languages!: string | null;

  @Column({ name: 'fee_text', type: 'varchar', length: 80, nullable: true })
  feeText!: string | null;

  @Column({ name: 'years_experience', type: 'int', nullable: true })
  yearsExperience!: number | null;

  /**
   * Whether this professional has been credential-verified by an admin.
   * Defaults to false on register; flipped to true via the admin endpoint
   * after a manual review. Patients see a "Verified" badge in /care.
   */
  @Column({ name: 'verified', type: 'boolean', default: false })
  verified!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'xp', type: 'int', default: 0 })
  xp!: number;

  @Column({ name: 'level', type: 'int', default: 1 })
  level!: number;

  @OneToMany(() => Task, (task) => task.user)
  tasks!: Task[];

  @OneToMany(() => UserHabit, (userhabit) => userhabit.user)
  userHabits!: UserHabit[];

  @OneToMany(() => UserBadge, (userBadge) => userBadge.user)
  userBadges!: UserBadge[];

  @OneToMany(() => Report, (report) => report.user)
  reports!: Report[];

  @OneToMany(() => BuddyConnection, (buddy) => buddy.requester)
  sentBuddyRequests!: BuddyConnection[];

  @OneToMany(() => BuddyConnection, (buddy) => buddy.receiver)
  receivedBuddyRequests!: BuddyConnection[];
}
