import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AiService } from '../ai/ai.service';
import { CreateJournalEntryDto } from './dto/create-journal-entry.dto';
import { JournalEntry } from './entities/journal-entry.entity';

@Injectable()
export class JournalService {
  private readonly logger = new Logger(JournalService.name);

  constructor(
    @InjectRepository(JournalEntry)
    private readonly entries: Repository<JournalEntry>,
    private readonly ai: AiService,
  ) {}

  async create(dto: CreateJournalEntryDto): Promise<JournalEntry> {
    const shouldAnalyze = dto.analyze ?? true;

    let sentimentScore: number | null = null;
    let feedbackEnglish: string | null = null;
    let feedbackUrdu: string | null = null;

    if (shouldAnalyze) {
      try {
        const analysis = await this.ai.analyzeSentiment(dto.content);
        sentimentScore = analysis.score;
        feedbackEnglish = analysis.englishMessage;
        feedbackUrdu = analysis.urduMessage;
      } catch (err) {
        // Don't fail the whole save if the AI service is unreachable —
        // the user's writing is more important than the analysis.
        this.logger.warn(
          `Sentiment analysis failed for user ${dto.userId}; saving entry without it. Error: ${(err as Error).message}`,
        );
      }
    }

    const entity = this.entries.create({
      userId: dto.userId,
      content: dto.content,
      sentimentScore,
      feedbackEnglish,
      feedbackUrdu,
    });
    return this.entries.save(entity);
  }

  /** Most-recent first. */
  findByUser(userId: number): Promise<JournalEntry[]> {
    return this.entries.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(entryId: number): Promise<JournalEntry> {
    const entry = await this.entries.findOne({ where: { entryId } });
    if (!entry) throw new NotFoundException('Journal entry not found');
    return entry;
  }

  async remove(entryId: number): Promise<{ message: string }> {
    const result = await this.entries.delete(entryId);
    if (result.affected === 0) {
      throw new NotFoundException('Journal entry not found');
    }
    return { message: 'Journal entry deleted' };
  }

  /**
   * Return the average sentiment score across the user's last `limit`
   * entries, or null if they have none. Useful for the dashboard mood tile.
   */
  async averageSentiment(
    userId: number,
    limit = 7,
  ): Promise<{ average: number | null; count: number }> {
    const recent = await this.entries.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
    const scored = recent.filter((e) => e.sentimentScore !== null);
    if (scored.length === 0) return { average: null, count: 0 };
    const avg =
      scored.reduce((sum, e) => sum + (e.sentimentScore ?? 0), 0) /
      scored.length;
    return { average: avg, count: scored.length };
  }
}
