import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('badges')
export class Badge {
  @PrimaryGeneratedColumn({ name: 'badge_id' })
  badgeId: number;

  @Column({ name: 'name', unique: true })
  name: string;

  @Column({ name: 'description' })
  description: string;

  @Column({ name: 'icon', type: 'varchar', nullable: true })
  icon: string | null;

  @Column({ name: 'xp_reward', type: 'int', default: 0 })
  xpReward: number;
}
