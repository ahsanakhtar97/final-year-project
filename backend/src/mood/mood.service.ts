import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';

import { UpsertMoodLogDto } from './dto/upsert-mood-log.dto';
import { MoodLog } from './entities/mood-log.entity';

@Injectable()
export class MoodService {
  constructor(
    @InjectRepository(MoodLog)
    private readonly repo: Repository<MoodLog>,
  ) {}

  /** Insert or update the row for (userId, date). */
  async upsert(userId: number, dto: UpsertMoodLogDto): Promise<MoodLog> {
    const existing = await this.repo.findOne({
      where: { userId, date: dto.date },
    });

    if (existing) {
      existing.score = dto.score;
      existing.emotionTags = dto.emotionTags ?? null;
      existing.note = dto.note ?? null;
      return this.repo.save(existing);
    }

    return this.repo.save(
      this.repo.create({
        userId,
        date: dto.date,
        score: dto.score,
        emotionTags: dto.emotionTags ?? null,
        note: dto.note ?? null,
      }),
    );
  }

  /** Recent logs oldest-first for charts. Defaults to 30 days. */
  async recent(userId: number, days = 30): Promise<MoodLog[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceIso = since.toISOString().slice(0, 10);

    return this.repo.find({
      where: { userId, date: MoreThanOrEqual(sinceIso) },
      order: { date: 'ASC' },
    });
  }

  /** Today's log for the current user, or null if not yet logged. */
  async today(userId: number): Promise<MoodLog | null> {
    const todayIso = new Date().toISOString().slice(0, 10);
    return this.repo.findOne({ where: { userId, date: todayIso } });
  }

  async remove(userId: number, moodLogId: number): Promise<{ message: string }> {
    const row = await this.repo.findOne({ where: { moodLogId } });
    if (!row || row.userId !== userId) {
      throw new NotFoundException('Mood log not found.');
    }
    await this.repo.delete({ moodLogId });
    return { message: 'Removed.' };
  }
}
