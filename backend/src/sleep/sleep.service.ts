import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThanOrEqual, Repository } from 'typeorm';

import { UpsertSleepLogDto } from './dto/upsert-sleep-log.dto';
import { SleepLog } from './entities/sleep-log.entity';

@Injectable()
export class SleepService {
  constructor(
    @InjectRepository(SleepLog)
    private readonly repo: Repository<SleepLog>,
  ) {}

  /** Insert or update the row for (userId, date). */
  async upsert(userId: number, dto: UpsertSleepLogDto): Promise<SleepLog> {
    const existing = await this.repo.findOne({
      where: { userId, date: dto.date },
    });
    if (existing) {
      existing.hours = dto.hours;
      existing.quality = dto.quality;
      existing.note = dto.note ?? null;
      return this.repo.save(existing);
    }
    return this.repo.save(
      this.repo.create({
        userId,
        date: dto.date,
        hours: dto.hours,
        quality: dto.quality,
        note: dto.note ?? null,
      }),
    );
  }

  /** Last N nights, oldest first (for charts). Defaults to 30 days. */
  async recent(userId: number, days = 30): Promise<SleepLog[]> {
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceIso = since.toISOString().slice(0, 10);
    return this.repo.find({
      where: { userId, date: MoreThanOrEqual(sinceIso) },
      order: { date: 'ASC' },
    });
  }

  async remove(userId: number, sleepLogId: number): Promise<{ message: string }> {
    const row = await this.repo.findOne({ where: { sleepLogId } });
    if (!row) throw new NotFoundException('Sleep log not found');
    if (row.userId !== userId) {
      throw new NotFoundException('Sleep log not found');
    }
    await this.repo.delete({ sleepLogId });
    return { message: 'Removed' };
  }
}
