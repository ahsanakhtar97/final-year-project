import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

import { GeminiService } from './gemini.service';

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
    private readonly gemini: GeminiService,
  ) {
    this.baseUrl =
      this.configService.get<string>('AI_SERVICE_URL') ?? 'http://127.0.0.1:5002';
  }

  /**
   * Qualitative sentiment analysis for the Growth Journal.
   *
   * NOTE on the fallback chain: we deliberately do NOT fall through to the
   * legacy Python keyword matcher when Gemini is unavailable. The Python
   * matcher used a bag-of-words heuristic that returned "Great mindset! ... 85"
   * for any entry containing the word "good" -- so "I didn't have a good day"
   * was misclassified as very positive. A wrong reflection is worse than no
   * reflection on a wellness app. When Gemini is unavailable we now save the
   * entry with a neutral score and an honest "saved without analysis" note.
   */
  async analyzeSentiment(text: string): Promise<{
    englishMessage: string;
    urduMessage: string;
    score: number;
  }> {
    if (this.gemini.isReady) {
      const ai = await this.gemini.analyzeJournalEntry(text);
      if (ai && ai.english) {
        return {
          englishMessage: ai.english,
          urduMessage:
            ai.urdu || 'آپ کی تحریر محفوظ کر لی گئی ہے۔',
          score: ai.score,
        };
      }
    }

    this.logger.warn(
      'Gemini unavailable for journal analysis -- saving entry with neutral score.',
    );
    return {
      englishMessage:
        "Saved. We couldn't generate a reflection right now -- your words are still here.",
      urduMessage: 'آپ کی تحریر محفوظ کر لی گئی ہے۔',
      score: 50,
    };
  }

  /**
   * Quantitative recommendation based on mood + outstanding-task count.
   * Gemini first, legacy Python service second, canned line last.
   */
  async getRecommendation(moodScore: number, tasksCount: number): Promise<string> {
    if (this.gemini.isReady) {
      const aiText = await this.gemini.generateRecommendation(moodScore, tasksCount);
      if (aiText) return aiText;
    }

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
   * Coaching reply: Gemini first, deterministic rule-based fallback second.
   * The fallback is kept so the coach page works even with no key configured.
   */
  async coach(dto: {
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
  }): Promise<{ reply: string; suggestions: string[]; tone: 'encourage' | 'celebrate' | 'reset' }> {
    if (this.gemini.isReady) {
      const ai = await this.gemini.generateCoachReply(
        (dto.message ?? '').trim(),
        dto.context ?? {},
      );
      if (ai && ai.reply) {
        return {
          reply: ai.reply,
          suggestions: ai.suggestions.length
            ? ai.suggestions
            : this.fallbackSuggestions(dto.context, ai.tone),
          tone: ai.tone,
        };
      }
    }

    return this.deterministicCoach(dto);
  }

  /** The original rule-based coach kept as an offline / no-key fallback. */
  private deterministicCoach(dto: {
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
          : 'Momentum is yours. Keep stacking small wins.',
      );
    } else {
      lines.push(
        open > 0
          ? `You have ${open} open task${open === 1 ? '' : 's'}. Pick the one with the smallest first step.`
          : "Clean slate. Use it to start something you've been postponing.",
      );
    }

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
    return {
      reply,
      suggestions: this.fallbackSuggestions(c, tone).slice(0, 3),
      tone,
    };
  }

  /** Default suggestions when Gemini doesn't return any. */
  private fallbackSuggestions(
    ctx: {
      openTasks?: number;
      recentMoodAvg?: number;
    } | undefined,
    tone: 'encourage' | 'celebrate' | 'reset',
  ): string[] {
    const open = ctx?.openTasks ?? 0;
    const mood = ctx?.recentMoodAvg;
    if (tone === 'reset') {
      const out = ['Open the journal -- one paragraph is enough', 'Run a 25-minute focus block on one easy task'];
      if (open > 0) out.push('Mark anything you can drop or defer');
      return out;
    }
    if (tone === 'celebrate') {
      const out = ['Add a stretch goal for today', 'Schedule a longer focus block while the streak is hot'];
      if (open > 0) out.push('Clear one harder task before the streak cools');
      return out;
    }
    const out = ['Pick one task and start a 25-minute focus block', 'Tick the easiest habit off your list'];
    if (mood === undefined) out.push('Write a quick journal entry to set a baseline');
    return out;
  }

  /** Detect mood score + emotion tags from a free-text description. */
  async analyzeMoodText(text: string): Promise<{ score: number; tags: string[]; reflection: string }> {
    if (this.gemini.isReady) {
      const result = await this.gemini.analyzeMoodText(text);
      if (result) return result;
    }
    return { score: 3, tags: [], reflection: "Saved — AI analysis unavailable right now." };
  }

  /** Parse a natural-language task description into structured fields. */
  async parseTaskDescription(description: string): Promise<{ title: string; description: string; priority: string; dueDate: string | null }> {
    if (this.gemini.isReady) {
      const result = await this.gemini.parseTaskDescription(description);
      if (result) return result;
    }
    return { title: description.slice(0, 60), description, priority: 'medium', dueDate: null };
  }

  /** Generate a personalised journal prompt based on recent mood. */
  async generateJournalPrompt(recentMoodAvg?: number, recentTags?: string[]): Promise<{ prompt: string }> {
    if (this.gemini.isReady) {
      const result = await this.gemini.generateJournalPrompt(recentMoodAvg, recentTags);
      if (result) return { prompt: result };
    }
    return { prompt: "What's one thing that felt heavy today, and one thing that felt light?" };
  }

  /** General purpose text generation (e.g. weekly reports) */
  async generateText(prompt: string): Promise<string> {
    if (this.gemini.isReady) {
      return this.gemini.generateText(prompt);
    }
    return 'Your weekly summary will appear here when the AI service is ready.';
  }

  /**
   * AI correlation insights: analyse the user's 30-day activity log and return
   * 3-5 data-driven insight cards about habits, mood, sleep, and task patterns.
   */
  async getCorrelationInsights(data: {
    days: { date: string; habitsCompleted: number; moodScore: number | null; sleepHours: number | null; tasksCompleted: number }[];
    totalHabitLogs: number;
    totalJournalEntries: number;
  }): Promise<{ title: string; insight: string; type: 'positive' | 'neutral' | 'warning' }[]> {
    if (this.gemini.isReady) {
      const result = await this.gemini.generateCorrelationInsights(data);
      if (result && result.length > 0) return result;
    }

    // Deterministic fallback
    const days = data.days.filter(d => d.habitsCompleted > 0 || d.moodScore !== null);
    if (days.length < 3) {
      return [{
        title: 'Not enough data yet',
        insight: 'Complete habits and journal entries for a few days and your personalised insights will appear here.',
        type: 'neutral',
      }];
    }

    const withMood = days.filter(d => d.moodScore !== null);
    const withHabits = days.filter(d => d.habitsCompleted > 0);
    const avgMoodHabits = withHabits.length
      ? withHabits.reduce((s, d) => s + (d.moodScore ?? 0), 0) / withHabits.length
      : null;
    const noHabitDays = days.filter(d => d.habitsCompleted === 0 && d.moodScore !== null);
    const avgMoodNoHabits = noHabitDays.length
      ? noHabitDays.reduce((s, d) => s + (d.moodScore ?? 0), 0) / noHabitDays.length
      : null;

    const insights: { title: string; insight: string; type: 'positive' | 'neutral' | 'warning' }[] = [];

    if (avgMoodHabits !== null && avgMoodNoHabits !== null) {
      const diff = avgMoodHabits - avgMoodNoHabits;
      if (diff > 1) {
        insights.push({ title: 'Habits lift your mood', insight: `Your mood averages ${avgMoodHabits.toFixed(1)}/10 on habit days vs ${avgMoodNoHabits.toFixed(1)}/10 on days you skip — a ${diff.toFixed(1)}-point difference.`, type: 'positive' });
      } else if (diff > 0) {
        insights.push({ title: 'Slight mood-habit link', insight: `You score ${diff.toFixed(1)} points higher on days you complete habits. Keep logging to confirm the trend.`, type: 'neutral' });
      }
    }

    const activeDaysPct = Math.round((withHabits.length / Math.max(days.length, 1)) * 100);
    insights.push({
      title: activeDaysPct >= 70 ? 'Strong consistency' : 'Room to grow',
      insight: `You completed at least one habit on ${activeDaysPct}% of the last ${days.length} tracked days.`,
      type: activeDaysPct >= 70 ? 'positive' : activeDaysPct >= 40 ? 'neutral' : 'warning',
    });

    if (withMood.length > 0) {
      const avgMood = withMood.reduce((s, d) => s + (d.moodScore ?? 0), 0) / withMood.length;
      insights.push({ title: 'Average mood', insight: `Your average mood over the last ${withMood.length} logged days is ${avgMood.toFixed(1)}/10.`, type: avgMood >= 7 ? 'positive' : avgMood >= 4 ? 'neutral' : 'warning' });
    }

    return insights;
  }
}
