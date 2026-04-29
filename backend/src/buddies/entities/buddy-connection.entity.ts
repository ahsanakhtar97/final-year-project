import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum BuddyStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity('buddy_connections')
export class BuddyConnection {
  @PrimaryGeneratedColumn()
  connectionId: number;

  @Column({ name: 'requester_id' })
  requesterId: number;

  @Column({ name: 'receiver_id' })
  receiverId: number;

  @Column({ type: 'enum', enum: BuddyStatus, default: BuddyStatus.PENDING })
  status: BuddyStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @ManyToOne(() => User, user => user.sentBuddyRequests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requester_id' })
  requester: User;

  @ManyToOne(() => User, user => user.receivedBuddyRequests, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'receiver_id' })
  receiver: User;
}
