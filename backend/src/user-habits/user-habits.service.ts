import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserHabitDto } from './dto/create-user-habit.dto';
import { UpdateUserHabitDto } from './dto/update-user-habit.dto';
import { UserHabit } from './entities/user-habit.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habit } from 'src/habits/entities/habit.entity';
import { HabitStatus } from 'src/habit-logs/enums/habit-status.enum';
import { HabitLog } from 'src/habit-logs/entities/habit-log.entity';

@Injectable()
export class UserHabitsService {
  constructor(@InjectRepository(UserHabit) private readonly userHabitRepository: Repository<UserHabit>) { }
  async assignHabit(createUserHabitDto: CreateUserHabitDto): Promise<string> {
    const exists=await this.findUserHabit(createUserHabitDto.userId,createUserHabitDto.habitId);
    if(exists) throw new ConflictException('User is already assigned this habit');
    await this.userHabitRepository.save({ ...createUserHabitDto, startDate: new Date() });
    return 'New habit assigned successfully!';
  }
  async findUserHabit(userId: number, habitId: number): Promise<UserHabit | null> {
    const userHabit = await this.userHabitRepository.findOne({ where: { userId, habitId } });
    return userHabit;
  }

  async findAll(): Promise<UserHabit[]> {
    return await this.userHabitRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} userHabit`;
  }

  update(id: number, updateUserHabitDto: UpdateUserHabitDto) {
    return `This action updates a #${id} userHabit`;
  }

  remove(id: number) {
    return `This action removes a #${id} userHabit`;
  }

  async revokeHabit(userId:number,habitId:number):Promise<string>{
    const userHabit=await this.findUserHabit(userId,habitId);
    if(!userHabit) throw new NotFoundException('Habit not found');
    await this.userHabitRepository.delete({userId,habitId});
    return 'Habit successfully removed';
  }

  async findHabitsByUserId(userId: number): Promise<Habit[]> {
    const userHabits = await this.userHabitRepository.find({ where: { userId }, relations: ['habit'] });
    const habits = userHabits.map(habit => habit.habit);
    return habits;
  }

  async getCompletedToday(userId: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const userHabits = await this.userHabitRepository.find({
      where: { userId },
      relations: ['habit', 'habitLogs'], // fetch logs
    });

    // filter logs to today & completed
    const habitLogs=userHabits.map(uh=>uh.habitLogs);
    return habitLogs.flat();
  }

  // Get completed logs for last 7 days
  async getCompletedLast7Days(userId: number):Promise<any> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const userHabits = await this.userHabitRepository.find({
      where: { userId },
      relations: ['habit', 'habitLogs'],
    });

    const habitLogs=userHabits.map(uh=>uh.habitLogs);
    return habitLogs.flat();
  }

  async getHabitStats(userId: number, days: number) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Fetch all user habits with logs in the last `days` days
  const userHabits = await this.userHabitRepository.find({
    where: { userId },
    relations: ['habit', 'habitLogs'],
  });

  // Map habits to stats
  const stats = userHabits.map((uh) => {
    // Filter logs for the last `days`
    const recentLogs = uh.habitLogs?.filter(log => log.date >= startDate) || [];

    const total = days;
    const done = recentLogs.filter(log => log.habitStatus === 'completed').length;
    const percentage = total ? Math.round((done / total) * 100) : 0;

    return {
      habitId: uh.habit.habitId,
      habitName: uh.habit.habitName,
      completed: done,
      total,
      percentage:percentage/100,
    };
  });

  return stats;
}
  async getBestWorstHabit(userId: number, days: number) {
  const habitStats = await this.getHabitStats(userId, days);

  if (!habitStats.length) return { best: null, worst: null };

  const sorted = [...habitStats].sort((a, b) => b.percentage - a.percentage);

  return {
    best: sorted[0] || null,
    worst: sorted[sorted.length - 1] || null,
  };
}


async getHabitStreaks(userId: number) {
  const userHabits = await this.userHabitRepository.find({
    where: { userId },
    relations: ['habit', 'habitLogs'],
  });

  const streaks = userHabits.map(uh => {
    // Sort logs by date ascending
    const logs = uh.habitLogs?.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()) || [];

    let longestStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const log of logs) {
      if (log.habitStatus === 'completed') {
        tempStreak++;
        if (tempStreak > longestStreak) longestStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    // Calculate current streak from the last date
    tempStreak = 0;
    for (let i = logs.length - 1; i >= 0; i--) {
      const logDate = new Date(logs[i].date);
      logDate.setHours(0, 0, 0, 0);

      if (logs[i].habitStatus === 'completed' &&
          (today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24) <= 1) {
        tempStreak++;
        today.setDate(today.getDate() - 1); // move back one day
      } else if ((today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24) > 1) {
        break; // streak broken
      } else {
        break;
      }
    }
    currentStreak = tempStreak;

    return {
      habitId: uh.habit.habitId,
      habitName: uh.habit.habitName,
      currentStreak,
      longestStreak,
    };
  });

  return streaks;
}

async getCompletedHabitsDaily(userId: number, days: number) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build array of past N dates
  const dates = Array.from({ length: days }).map((_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (days - 1 - i));
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Fetch user habits with logs
  const userHabits = await this.userHabitRepository.find({
    where: { userId },
    relations: ['habitLogs'],
  });

  const dailyCounts = dates.map(d => {
    const dateKey = d.toISOString().slice(0, 10);
    
    // Count habits completed on this date
    let count = 0;
    userHabits.forEach(uh => {
      if (uh.habitLogs?.some(log => log.date.toISOString().slice(0, 10) === dateKey && log.habitStatus === HabitStatus.COMPLETED)) {
        count++;
      }
    });

    return {
      date: dateKey,
      completed: count,
    };
  });

  return dailyCounts;
}



}
