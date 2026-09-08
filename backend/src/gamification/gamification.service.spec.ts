import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { Badge } from './entities/badge.entity';
import { UserBadge } from './entities/user-badge.entity';
import { GamificationService } from './gamification.service';

/**
 * GamificationService talks to three repositories. The DB is mocked -- these
 * tests cover the leveling arithmetic, not TypeORM.
 */
describe('GamificationService', () => {
  let service: GamificationService;
  let userRepo: { findOne: jest.Mock; save: jest.Mock };
  let badgeRepo: { find: jest.Mock };
  let userBadgeRepo: { find: jest.Mock };

  beforeEach(async () => {
    userRepo = {
      findOne: jest.fn(),
      save: jest.fn((x) => Promise.resolve(x)),
    };
    badgeRepo = { find: jest.fn(() => Promise.resolve([])) };
    userBadgeRepo = { find: jest.fn(() => Promise.resolve([])) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GamificationService,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Badge), useValue: badgeRepo },
        { provide: getRepositoryToken(UserBadge), useValue: userBadgeRepo },
      ],
    }).compile();

    service = module.get<GamificationService>(GamificationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('awardXp', () => {
    it('accumulates XP without leveling up below the threshold', async () => {
      userRepo.findOne.mockResolvedValue({ userId: 1, xp: 10, level: 1 });

      const { user, leveledUp } = await service.awardXp(1, 50);

      expect(leveledUp).toBe(false);
      expect(user.level).toBe(1);
      expect(user.xp).toBe(60);
      expect(userRepo.save).toHaveBeenCalledWith(user);
    });

    it('levels up and carries the remainder over', async () => {
      userRepo.findOne.mockResolvedValue({ userId: 1, xp: 90, level: 1 });

      // 90 + 30 = 120; level 1 -> 2 costs 100, leaving 20 XP at level 2.
      const { user, leveledUp } = await service.awardXp(1, 30);

      expect(leveledUp).toBe(true);
      expect(user.level).toBe(2);
      expect(user.xp).toBe(20);
    });

    it('levels up more than once when a single award is large enough', async () => {
      userRepo.findOne.mockResolvedValue({ userId: 1, xp: 0, level: 1 });

      // 350 XP: -100 (lvl 2), -200 (lvl 3), 50 left over -- lvl 3 -> 4 needs 300.
      const { user, leveledUp } = await service.awardXp(1, 350);

      expect(leveledUp).toBe(true);
      expect(user.level).toBe(3);
      expect(user.xp).toBe(50);
    });

    it('throws when the user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);

      await expect(service.awardXp(404, 10)).rejects.toThrow('User not found');
      expect(userRepo.save).not.toHaveBeenCalled();
    });
  });
});
