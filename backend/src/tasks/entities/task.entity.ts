import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn } from "typeorm";
import { TaskStatus } from "../enums/task-status.enum";
import { TaskPriority } from "../enums/task-priority.enum";
import { User } from "../../users/entities/user.entity";

@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn({ name: 'task_id' })
    taskId: number;

    @Column({ name: 'user_id' })
    userId: number;

    @Column({ name: 'title' })
    title: string;

    @Column({ name: 'description', nullable: true })
    description: string;

    @Column({
        name: 'task_status',
        type: 'enum',
        enum: TaskStatus,
        default: TaskStatus.TO_DO
    })
    taskStatus: TaskStatus;

    @Column({
        name: 'priority',
        type: 'enum',
        enum: TaskPriority,
        default: TaskPriority.MEDIUM,
    })
    priority: TaskPriority;

    @Column({ name: 'due_date', type: 'timestamp', nullable: true })
    dueDate: Date | null;

    @Column({
        name: 'completed_at',
        type: 'timestamp',
        nullable: true
    })
    completedAt: Date | null;

    @Column({ name: 'focus_minutes', type: 'int', default: 0 })
    focusMinutes: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @ManyToOne(() => User, (user) => user.tasks, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'user_id' })
    user: User;
}
