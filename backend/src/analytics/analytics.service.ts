import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HabitLog } from '../habit-logs/entities/habit-log.entity';
import { JournalEntry } from '../journal/entities/journal-entry.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(HabitLog)
    private readonly habitLogsRepository: Repository<HabitLog>,
    @InjectRepository(JournalEntry)
    private readonly journalRepository: Repository<JournalEntry>,
  ) {}

  async getUserAnalytics(userId: number) {
    const habitLogs = await this.habitLogsRepository.find({
      where: { userHabit: { userId } },
      relations: ['userHabit', 'userHabit.habit'],
      order: { date: 'ASC' }
    });

    const journalEntries = await this.journalRepository.find({
      where: { userId },
      order: { createdAt: 'ASC' }
    });

    // Group habit completions by date
    const dailyHabits: Record<string, number> = {};
    habitLogs.forEach(log => {
      if (log.status === 'completed') {
        dailyHabits[log.date] = (dailyHabits[log.date] || 0) + 1;
      }
    });

    // Group journal sentiment by date
    const dailyMoods: Record<string, number> = {};
    journalEntries.forEach(entry => {
      const date = new Date(entry.createdAt).toISOString().split('T')[0];
      if (entry.sentimentScore !== null) {
        // Normalize sentimentScore (-1 to 1) to (0 to 10)
        dailyMoods[date] = ((entry.sentimentScore + 1) / 2) * 10;
      }
    });

    // Merge data into an array
    const dates = Array.from(new Set([...Object.keys(dailyHabits), ...Object.keys(dailyMoods)])).sort();
    
    const correlations = dates.map(date => ({
      date,
      habitsCompleted: dailyHabits[date] || 0,
      moodScore: dailyMoods[date] ? Math.round(dailyMoods[date]) : null,
    }));

    return { correlations };
  }
}
