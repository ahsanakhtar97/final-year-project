import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface SentimentResponse {
  english: string;
  urdu: string;
  sentiment_score: number;
}

interface RecommendationResponse {
  recommendation: string;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('AI_SERVICE_URL') ?? 'http://127.0.0.1:5002';
  }

  /**
   * Qualitative sentiment analysis for the Growth Journal.
   * Falls back to a friendly canned message when the Python service is down.
   */
  async analyzeSentiment(text: string): Promise<{
    englishMessage: string;
    urduMessage: string;
    score: number;
  }> {
    const url = `${this.baseUrl}/analyze_text`;

    try {
      const response = await firstValueFrom(
        this.httpService.post<SentimentResponse>(url, { text }),
      );
      return {
        englishMessage: response.data.english,
        urduMessage: response.data.urdu,
        score: response.data.sentiment_score,
      };
    } catch (error) {
      this.logger.warn(
        `Sentiment analysis fallback engaged: ${(error as Error).message}`,
      );
      return {
        englishMessage: 'Reflection saved. Keep tracking your progress!',
        urduMessage: 'آپ کی تحریر محفوظ کر لی گئی ہے۔',
        score: 50,
      };
    }
  }

  /**
   * Quantitative recommendation based on mood + outstanding-task count.
   */
  async getRecommendation(moodScore: number, tasksCount: number): Promise<string> {
    const url = `${this.baseUrl}/recommend`;
    const payload = {
      mood_score: moodScore,
      incomplete_tasks_count: tasksCount,
    };

    try {
      const response = await firstValueFrom(
        this.httpService.post<RecommendationResponse>(url, payload),
      );
      return response.data.recommendation;
    } catch (error) {
      this.logger.warn(
        `Recommendation fallback engaged: ${(error as Error).message}`,
      );
      return 'Keep pushing forward! (جاری رکھیں!)';
    }
  }
  /**
   * Build a coaching reply from a context snapshot the frontend supplies. We
   * keep this deterministic + offline-safe so it works even without the Python
   * service or any LLM credits attached. The response shape is small so the
   * UI can render a chat-style message plus a couple of next-step chips.
   */
  coach(dto: {
    message?: string;
    context: {
      openTasks?: number;
      tasksCompleted7d?: number;
      recentMoodAvg?: number;
      bestStreak?: number;
      focusMinutesToday?: number;
      habitsDoneToday?: number;
      habitsTotalToday?: number;
    };
  }): { reply: string; suggestions: string[]; tone: 'encourage' | 'celebrate' | 'reset' } {
    const c = dto.context ?? {};
    const userMsg = (dto.message ?? '').trim();

    const mood = c.recentMoodAvg;
    const open = c.openTasks ?? 0;
    const done7 = c.tasksCompleted7d ?? 0;
    const streak = c.bestStreak ?? 0;
    const focus = c.focusMinutesToday ?? 0;
    const habitsDone = c.habitsDoneToday ?? 0;
    const habitsTotal = c.habitsTotalToday ?? 0;

    let tone: 'encourage' | 'celebrate' | 'reset' = 'encourage';
    if (mood !== undefined && mood < 4) tone = 'reset';
    else if (streak >= 7 || done7 >= 10 || focus >= 50) tone = 'celebrate';

    const lines: string[] = [];

    // Acknowledge the user's typed message if any.
    if (userMsg) {
      const lc = userMsg.toLowerCase();
      if (/(stuck|stressed|overwhelm|tired|burn)/.test(lc)) {
        tone = 'reset';
        lines.push(
          "I hear you -- it sounds like things feel heavy right now. Let's make today smaller, not bigger.",
        );
      } else if (/(motivat|excited|ready|let.?s go|grind)/.test(lc)) {
        tone = tone === 'reset' ? 'encourage' : 'celebrate';
        lines.push("Love the energy. Let's channel it.");
      } else {
        lines.push(`Got it -- "${userMsg.slice(0, 80)}".`);
      }
    }

    // Mood-aware opener.
    if (tone === 'reset') {
      lines.push(
        mood !== undefined
          ? `Your mood has averaged ${mood.toFixed(1)}/10 lately. That's a signal to lower the bar, not raise it.`
          : "Some days are about rest, not progress -- and that's a complete sentence.",
      );
    } else if (tone === 'celebrate') {
      const wins: string[] = [];
      if (streak >= 7) wins.push(`a ${streak}-day streak`);
      if (done7 >= 10) wins.push(`${done7} tasks shipped this week`);
      if (focus >= 50) wins.push(`${focus} focused minutes today`);
      lines.push(
        wins.length
          ? `You're on a tear -- ${wins.join(', ')}. That's compounding work.`
          : "Momentum is yours. Keep stacking small wins.",
      );
    } else {
      lines.push(
        open > 0
          ? `You have ${open} open task${open === 1 ? '' : 's'}. Pick the one with the smallest first step.`
          : "Clean slate. Use it to start something you've been postponing.",
      );
    }

    // Habit nudge if applicable.
    if (habitsTotal > 0) {
      const remaining = Math.max(0, habitsTotal - habitsDone);
      if (remaining === 0) {
        lines.push(`All ${habitsTotal} habits done today -- that's the kind of day worth remembering.`);
      } else if (habitsDone === 0) {
        lines.push(`Zero of ${habitsTotal} habits ticked yet. Start with the easiest one to break the seal.`);
      } else {
        lines.push(`${habitsDone}/${habitsTotal} habits in. ${remaining} small win${remaining === 1 ? '' : 's'} away from a clean sheet.`);
      }
    }

    const reply = lines.join(' ');

    // Suggestions: 2-3 concrete actions tuned to tone.
    const suggestions: string[] = [];
    if (tone === 'reset') {
      suggestions.push('Open the journal -- one paragraph is enough');
      suggestions.push('Run a 25-minute focus block on one easy task');
      if (open > 0) suggestions.push('Mark anything you can drop or defer');
    } else if (tone === 'celebrate') {
      suggestions.push('Add a stretch goal for today');
      suggestions.push('Schedule a longer focus block while the streak is hot');
      if (open > 0) suggestions.push('Clear one harder task before the streak cools');
    } else {
      suggestions.push('Pick one task and start a 25-minute focus block');
      suggestions.push('Tick the easiest habit off your list');
      if (mood === undefined) suggestions.push('Write a quick journal entry to set a baseline');
    }

    return { reply, suggestions: suggestions.slice(0, 3), tone };
  }

}
