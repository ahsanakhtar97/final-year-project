import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { HabitLog } from '../habit-logs/entities/habit-log.entity';
import { HabitStatus } from '../habit-logs/enums/habit-status.enum';
import { Habit } from '../habits/entities/habit.entity';
import { CreateUserHabitDto } from './dto/create-user-habit.dto';
import { UserHabit } from './entities/user-habit.entity';

interface DbError {
  code?: string;
}

@Injectable()
export class UserHabitsService {
  private readonly logger = new Logger(UserHabitsService.name);

  constructor(
    @InjectRepository(UserHabit)
    private readonly userHabitRepository: Repository<UserHabit>,
  ) {}

  async assignHabit(dto: CreateUserHabitDto): Promise<UserHabit> {
    const exists = await this.findUserHabit(dto.userId, dto.habitId);
    if (exists) throw new ConflictException('User is already assigned this habit');

    try {
      const entity = this.userHabitRepository.create({
        ...dto,
        startDate: new Date(),
      });
      return await this.userHabitRepository.save(entity);
    } catch (err) {
      if ((err as DbError).code === '23505') {
        throw new ConflictException('User is already assigned this habit');
      }
      this.logger.error('Failed to assign habit', err as Error);
      throw new InternalServerErrorException('Could not assign habit');
    }
  }

  findUserHabit(userId: number, habitId: number): Promise<UserHabit | null> {
    return this.userHabitRepository.findOne({ where: { userId, habitId } });
  }

  findAll(): Promise<UserHabit[]> {
    return this.userHabitRepository.find();
  }

  async findOne(id: number): Promise<UserHabit> {
    const userHabit = await this.userHabitRepository.findOne({
      where: { userHabitId: id },
      relations: ['habit', 'user'],
    });
    if (!userHabit) throw new NotFoundException('User-habit not found');
    return userHabit;
  }

  async remove(id: number): Promise<{ message: string }> {
    const result = await this.userHabitRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User-habit not found');
    }
    return { message: 'User-habit removed successfully' };
  }

  async revokeHabit(userId: number, habitId: number): Promise<{ message: string }> {
    // Find the join row first so we can clean up its logs explicitly. This
    // makes the operation safe even on schemas where the FK from habit_logs
    // -> user_habits hasn't been migrated to ON DELETE CASCADE yet.
    const userHabit = await this.userHabitRepository.findOne({
      where: { userId, habitId },
    });
    if (!userHabit) {
      throw new NotFoundException('Habit not found for this user');
    }

    await this.userHabitRepository.manager.transaction(async (tx) => {
      // Use the typed repository so we don't depend on TypeORM's auto-named
      // FK column (which varies with the active naming strategy).
      await tx.delete(HabitLog, {
        userHabit: { userHabitId: userHabit.userHabitId },
      });
      await tx.delete(UserHabit, { userHabitId: userHabit.userHabitId });
    });

    return { message: 'Habit successfully removed' };
  }

  async findHabitsByUserId(userId: number): Promise<Habit[]> {
    const userHabits = await this.userHabitRepository.find({
      where: { userId },
      relations: ['habit'],
    });
    return userHabits.map((uh) => uh.habit);
  }

  async getCompletedToday(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userHabits = await this.userHabitRepository.find({
      where: { userId },
      relations: ['habit', 'habitLogs'],
    });

    return userHabits.flatMap((uh) => uh.habitLogs ?? []);
  }

  async getCompletedLast7Days(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const userHabits = await this.userHabitRepository.find({
      where: { userId },
      relations: ['habit', 'habitLogs'],
    });

    return userHabits.flatMap((uh) => uh.habitLogs ?? []);
  }

  async getHabitStats(userId: number, days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const userHabits = await this.userHabitRepository.find({
      where: { userId },
      relations: ['habit', 'habitLogs'],
    });

    return userHabits.map((uh) => {
      const recentLogs =
        uh.habitLogs?.filter((log) => new Date(log.date) >= startDate) ?? [];
      const total = days;
      const done = recentLogs.filter((log) => log.status === HabitStatus.COMPLETED).length;
      const percentage = total ? Math.round((done / total) * 100) : 0;

      return {
        habitId: uh.habit.habitId,
        habitName: uh.habit.habitName,
        completed: done,
        total,
        percentage: percentage / 100,
      };
    });
  }

  async getBestWorstHabit(userId: number, days: number) {
    const habitStats = await this.getHabitStats(userId, days);
    if (!habitStats.length) return { best: null, worst: null };

    const sorted = [...habitStats].sort((a, b) => b.percentage - a.percentage);
    return {
      best: sorted[0] ?? null,
      worst: sorted[sorted.length - 1] ?? null,
    };
  }

  async getHabitStreaks(userId: number) {
    const userHabits = await this.userHabitRepository.find({
      where: { userId },
      relations: ['habit', 'habitLogs'],
    });

    return userHabits.map((uh) => {
      const logs =
        uh.habitLogs?.slice().sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
        ) ?? [];

      let longestStreak = 0;
      let tempStreak = 0;

      for (const log of logs) {
        if (log.status === HabitStatus.COMPLETED) {
          tempStreak++;
          if (tempStreak > longestStreak) longestStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
      }

      // Current streak from the most recent date backwards.
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let currentStreak = 0;
      for (let i = logs.length - 1; i >= 0; i--) {
        const logDate = new Date(logs[i].date);
        logDate.setHours(0, 0, 0, 0);
        const diffDays = (today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);

        if (logs[i].status === HabitStatus.COMPLETED && diffDays <= 1) {
          currentStreak++;
          today.setDate(today.getDate() - 1);
        } else {
          break;
        }
      }

      return {
        habitId: uh.habit.habitId,
        habitName: uh.habit.habitName,
        currentStreak,
        longestStreak,
      };
    });
  }

  async getCompletedHabitsDaily(userId: number, days: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dates = Array.from({ length: days }).map((_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (days - 1 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const userHabits = await this.userHabitRepository.find({
      where: { userId },
      relations: ['habitLogs'],
    });

    return dates.map((d) => {
      const dateKey = d.toISOString().slice(0, 10);
      let count = 0;
      userHabits.forEach((uh) => {
        if (
          uh.habitLogs?.some(
            (log) =>
              String(log.date).slice(0, 10) === dateKey &&
              log.status === HabitStatus.COMPLETED,
          )
        ) {
          count++;
        }
      });
      return { date: dateKey, completed: count };
    });
  }
}
