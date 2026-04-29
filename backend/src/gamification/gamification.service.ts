import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';

@Injectable()
export class GamificationService {
  private readonly logger = new Logger(GamificationService.name);

  // Simple leveling formula: XP needed for next level = level * 100
  // e.g., Level 1 -> 2 needs 100 XP. Level 2 -> 3 needs 200 XP.
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Badge)
    private readonly badgeRepository: Repository<Badge>,
    @InjectRepository(UserBadge)
    private readonly userBadgeRepository: Repository<UserBadge>,
  ) {}

  async awardXp(userId: number, xpAmount: number): Promise<{ user: User; leveledUp: boolean }> {
    const user = await this.userRepository.findOne({ where: { userId } });
    if (!user) {
      throw new Error('User not found');
    }

    user.xp += xpAmount;
    let leveledUp = false;

    // Check if user has enough XP to level up
    let xpNeeded = user.level * 100;
    while (user.xp >= xpNeeded) {
      user.xp -= xpNeeded;
      user.level += 1;
      leveledUp = true;
      xpNeeded = user.level * 100;
      this.logger.log(`User ${userId} leveled up to ${user.level}!`);
    }

    await this.userRepository.save(user);

    return { user, leveledUp };
  }

  async getBadges(): Promise<Badge[]> {
    return this.badgeRepository.find();
  }

  async getUserBadges(userId: number): Promise<UserBadge[]> {
    return this.userBadgeRepository.find({
      where: { userId },
      relations: ['badge'],
    });
  }
}
