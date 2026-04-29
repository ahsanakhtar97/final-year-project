import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

/**
 * Thin wrapper around the Google Gemini SDK that powers GrowFlow's three
 * AI surfaces:
 *
 *   1. AI Coach chat replies (structured JSON)
 *   2. Dashboard recommendation / quote (single string)
 *   3. Growth Journal sentiment analysis (structured JSON)
 *
 * Design rules:
 *   - The service is initialized lazily and degrades gracefully when no
 *     GEMINI_API_KEY is configured. Callers are expected to wrap calls in
 *     try/catch and use a deterministic fallback.
 *   - All structured outputs go through `responseMimeType: 'application/json'`
 *     and a strict JSON schema so we don't have to regex parse the reply.
 *   - System prompts are tuned for GrowFlow's wellness tone: warm, calm,
 *     specific, no toxic positivity, and gentle when the user's mood is low.
 */

export interface CoachContextSnapshot {
  openTasks?: number;
  tasksCompleted7d?: number;
  recentMoodAvg?: number; // 1..10 scale
  bestStreak?: number; // days
  focusMinutesToday?: number;
  habitsDoneToday?: number;
  habitsTotalToday?: number;
}

export interface CoachReply {
  reply: string;
  suggestions: string[];
  tone: 'encourage' | 'celebrate' | 'reset';
}

export interface JournalSentiment {
  english: string;
  urdu: string;
  score: number; // 0..100
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly model?: GenerativeModel;
  private readonly modelName: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    this.modelName = this.config.get<string>('GEMINI_MODEL') ?? 'gemini-1.5-flash';

    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY not set -- Gemini features will fall back to canned responses. ' +
          'Add GEMINI_API_KEY to backend/.env to enable real AI replies.',
      );
      return;
    }

    try {
      const client = new GoogleGenerativeAI(apiKey);
      this.model = client.getGenerativeModel({
        model: this.modelName,
        systemInstruction:
          "You are GrowFlow's gentle AI companion. You help the user build " +
          'small, sustainable wellness habits. Be warm, specific, and brief. ' +
          'Avoid toxic positivity. Never invent metrics. When the user seems ' +
          'low, lower the bar -- do not push harder. Use plain language; no ' +
          'emojis unless the user uses them first.',
      });
      this.logger.log(`Gemini model ready: ${this.modelName}`);
    } catch (err) {
      this.logger.error(
        `Failed to initialise Gemini -- using fallbacks. ${(err as Error).message}`,
      );
    }
  }

  /** True when Gemini is actually wired up. Callers can short-circuit if not. */
  get isReady(): boolean {
    return !!this.model;
  }

  // -------------------- AI COACH --------------------

  async generateCoachReply(
    userMessage: string,
    context: CoachContextSnapshot,
  ): Promise<CoachReply | null> {
    if (!this.model) return null;

    const prompt = this.buildCoachPrompt(userMessage, context);

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.85,
          maxOutputTokens: 800,
        },
      });
      const text = result.response.text();
      const parsed = JSON.parse(text) as Partial<CoachReply>;

      const tone = (['encourage', 'celebrate', 'reset'] as const).includes(
        parsed.tone as CoachReply['tone'],
      )
        ? (parsed.tone as CoachReply['tone'])
        : 'encourage';

      return {
        reply: typeof parsed.reply === 'string' ? parsed.reply.trim() : '',
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions
              .filter((s): s is string => typeof s === 'string')
              .slice(0, 3)
          : [],
        tone,
      };
    } catch (err) {
      this.logger.warn(
        `Gemini coach call failed: ${(err as Error).message}`,
      );
      return null;
    }
  }

  private buildCoachPrompt(userMsg: string, ctx: CoachContextSnapshot): string {
    const facts = [
      ctx.openTasks !== undefined && `open tasks: ${ctx.openTasks}`,
      ctx.tasksCompleted7d !== undefined && `tasks completed in last 7 days: ${ctx.tasksCompleted7d}`,
      ctx.recentMoodAvg !== undefined && `recent average mood (1-10): ${ctx.recentMoodAvg.toFixed(1)}`,
      ctx.bestStreak !== undefined && `current best habit streak (days): ${ctx.bestStreak}`,
      ctx.focusMinutesToday !== undefined && `focus minutes today: ${ctx.focusMinutesToday}`,
      ctx.habitsTotalToday !== undefined &&
        `habits today: ${ctx.habitsDoneToday ?? 0} done / ${ctx.habitsTotalToday} total`,
    ]
      .filter(Boolean)
      .join('\n  - ');

    return [
      `User said: "${userMsg.slice(0, 500) || '(no message -- give a check-in)'}"`,
      '',
      'Context snapshot:',
      `  - ${facts || '(no metrics yet)'}`,
      '',
      'Reply as a JSON object matching exactly this TypeScript type:',
      '{',
      '  "reply": string;             // 1-3 sentences, max ~280 characters total. Specific to the data above.',
      '  "suggestions": string[];     // 2 or 3 short concrete next steps. Each <= 10 words.',
      '  "tone": "encourage" | "celebrate" | "reset"; // pick "reset" if mood < 4 or user sounds overwhelmed; "celebrate" if streak >= 7 OR completed >= 10; otherwise "encourage".',
      '}',
      '',
      'Rules: never invent metrics. Reference at most one or two real numbers from the snapshot. ' +
        'Sound like a calm friend, not a coach barking orders. No emojis. No markdown. Output JSON only.',
    ].join('\n');
  }

  // -------------------- DASHBOARD RECOMMENDATION --------------------

  async generateRecommendation(
    moodScore: number,
    openTasksCount: number,
  ): Promise<string | null> {
    if (!this.model) return null;

    const prompt = [
      `Current mood (1-10): ${moodScore}`,
      `Open tasks: ${openTasksCount}`,
      '',
      "Write ONE short wellness micro-recommendation for the user's dashboard. " +
        'It should be 1 sentence, max ~140 characters, specific to the mood and task load above. ' +
        'Warm but not saccharine. No toxic positivity. No emojis. No quotes around it. ' +
        'Just the sentence.',
    ].join('\n');

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 80 },
      });
      const text = result.response.text().trim().replace(/^["']|["']$/g, '');
      return text.length > 0 ? text : null;
    } catch (err) {
      this.logger.warn(
        `Gemini recommendation call failed: ${(err as Error).message}`,
      );
      return null;
    }
  }

  // -------------------- JOURNAL SENTIMENT --------------------

  async analyzeJournalEntry(text: string): Promise<JournalSentiment | null> {
    if (!this.model) return null;

    const prompt = [
      'You are reflecting back on a personal journal entry the user wrote.',
      'Read the entry, then output a JSON object that matches:',
      '{',
      '  "english": string;  // 1-2 warm sentences reflecting what you noticed. Specific, not generic. STRICT max 200 characters.',
      '  "urdu": string;     // The same reflection in natural Urdu. STRICT max 200 characters.',
      '  "score": number;    // 0..100 sentiment score; 0 very negative, 50 neutral, 100 very positive. Be honest, not flattering.',
      '}',
      '',
      'Length rules are HARD limits -- if you go over, the JSON will be truncated and the user sees nothing. ' +
        'Keep both strings short. Output JSON only -- no markdown, no preamble.',
      '',
      'Tone rules: empathic, calm, never preachy, never toxic positivity. ' +
        'If the entry is short or neutral, your reflection should be short too.',
      '',
      `Entry:\n"""\n${text.slice(0, 4000)}\n"""`,
    ].join('\n');

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.6,
          // Generous budget: Urdu uses ~2-3x more tokens per character than
          // English, so 200-char strings in both languages need real headroom
          // before JSON gets truncated mid-string and parse fails.
          maxOutputTokens: 1200,
        },
      });
      const raw = result.response.text();
      const parsed = JSON.parse(raw) as Partial<JournalSentiment>;
      const score =
        typeof parsed.score === 'number' && Number.isFinite(parsed.score)
          ? Math.max(0, Math.min(100, Math.round(parsed.score)))
          : 50;
      return {
        english: typeof parsed.english === 'string' ? parsed.english.trim() : '',
        urdu: typeof parsed.urdu === 'string' ? parsed.urdu.trim() : '',
        score,
      };
    } catch (err) {
      this.logger.warn(
        `Gemini journal call failed: ${(err as Error).message}`,
      );
      return null;
    }
  }

  // -------------------- GENERAL TEXT GENERATION --------------------

  async generateText(prompt: string): Promise<string> {
    if (!this.model) return 'AI summaries are currently unavailable.';

    try {
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 500 },
      });
      return result.response.text().trim();
    } catch (err) {
      this.logger.warn(`Gemini generateText failed: ${(err as Error).message}`);
      return 'AI summaries are currently unavailable.';
    }
  }
}
