import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

/**
 * Thin wrapper around the Groq API that powers GrowFlow's three AI surfaces:
 *
 *   1. AI Coach chat replies (structured JSON)
 *   2. Dashboard recommendation / quote (single string)
 *   3. Growth Journal sentiment analysis (structured JSON)
 *
 * The class is intentionally named GeminiService to keep the rest of the
 * codebase unchanged. Internally it now calls Groq (llama-3.3-70b-versatile
 * by default) which has a generous free tier and very fast inference.
 *
 * Design rules:
 *   - Degrades gracefully when GROQ_API_KEY is missing — callers always get
 *     a usable fallback from AiService.
 *   - All structured outputs request JSON via response_format so we never
 *     need to regex-parse the reply.
 *   - System prompt is tuned for GrowFlow's wellness tone: warm, calm,
 *     specific, no toxic positivity.
 */

export interface CoachContextSnapshot {
  openTasks?: number;
  tasksCompleted7d?: number;
  recentMoodAvg?: number;
  bestStreak?: number;
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

const SYSTEM_PROMPT =
  "You are GrowFlow's gentle AI companion. You help the user build " +
  'small, sustainable wellness habits. Be warm, specific, and brief. ' +
  'Avoid toxic positivity. Never invent metrics. When the user seems ' +
  'low, lower the bar — do not push harder. Use plain language; no ' +
  'emojis unless the user uses them first.';

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly client?: Groq;
  private readonly modelName: string;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    this.modelName =
      this.config.get<string>('GROQ_MODEL') ?? 'llama-3.3-70b-versatile';

    if (!apiKey) {
      this.logger.warn(
        'GROQ_API_KEY not set — AI features will fall back to canned responses. ' +
          'Add GROQ_API_KEY to backend/.env to enable real AI replies.',
      );
      return;
    }

    try {
      this.client = new Groq({ apiKey });
      this.logger.log(`Groq model ready: ${this.modelName}`);
    } catch (err) {
      this.logger.error(
        `Failed to initialise Groq — using fallbacks. ${(err as Error).message}`,
      );
    }
  }

  get isReady(): boolean {
    return !!this.client;
  }

  // -------------------- AI COACH --------------------

  async generateCoachReply(
    userMessage: string,
    context: CoachContextSnapshot,
  ): Promise<CoachReply | null> {
    if (!this.client) return null;

    const prompt = this.buildCoachPrompt(userMessage, context);

    try {
      const completion = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.85,
        max_tokens: 800,
      });

      const text = completion.choices[0]?.message?.content ?? '';
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
      this.logger.warn(`Groq coach call failed: ${(err as Error).message}`);
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
      `User said: "${userMsg.slice(0, 500) || '(no message — give a check-in)'}"`,
      '',
      'Context snapshot:',
      `  - ${facts || '(no metrics yet)'}`,
      '',
      'Reply as a JSON object matching exactly this TypeScript type:',
      '{',
      '  "reply": string;             // 1-3 sentences, max ~280 characters. Specific to the data above.',
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
    if (!this.client) return null;

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
      const completion = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.9,
        max_tokens: 80,
      });

      const text = (completion.choices[0]?.message?.content ?? '')
        .trim()
        .replace(/^["']|["']$/g, '');
      return text.length > 0 ? text : null;
    } catch (err) {
      this.logger.warn(`Groq recommendation call failed: ${(err as Error).message}`);
      return null;
    }
  }

  // -------------------- JOURNAL SENTIMENT --------------------

  async analyzeJournalEntry(text: string): Promise<JournalSentiment | null> {
    if (!this.client) return null;

    const prompt = [
      'You are reflecting back on a personal journal entry the user wrote.',
      'Read the entry, then output a JSON object that matches:',
      '{',
      '  "english": string;  // 1-2 warm sentences reflecting what you noticed. Specific, not generic. STRICT max 200 characters.',
      '  "urdu": string;     // The same reflection in natural Urdu. STRICT max 200 characters.',
      '  "score": number;    // 0..100 sentiment score; 0 very negative, 50 neutral, 100 very positive. Be honest.',
      '}',
      '',
      'Keep both strings short. Output JSON only — no markdown, no preamble.',
      'Tone: empathic, calm, never preachy, never toxic positivity.',
      '',
      `Entry:\n"""\n${text.slice(0, 4000)}\n"""`,
    ].join('\n');

    try {
      const completion = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.6,
        max_tokens: 400,
      });

      const raw = completion.choices[0]?.message?.content ?? '';
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
      this.logger.warn(`Groq journal call failed: ${(err as Error).message}`);
      return null;
    }
  }

  // -------------------- GENERAL TEXT GENERATION --------------------

  async generateText(prompt: string): Promise<string> {
    if (!this.client) return 'AI summaries are currently unavailable.';

    try {
      const completion = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      });
      return (completion.choices[0]?.message?.content ?? '').trim();
    } catch (err) {
      this.logger.warn(`Groq generateText failed: ${(err as Error).message}`);
      return 'AI summaries are currently unavailable.';
    }
  }

  // -------------------- MOOD TEXT ANALYSIS --------------------

  async analyzeMoodText(text: string): Promise<{ score: number; tags: string[]; reflection: string } | null> {
    if (!this.client) return null;

    const VALID_TAGS = [
      'anxious','calm','content','energized','excited','focused',
      'grateful','hopeful','irritable','overwhelmed','sad','tired',
    ];

    const prompt = [
      'The user wrote a short description of how they are feeling today.',
      'Analyse it and return a JSON object matching:',
      '{',
      '  "score": number,       // 1 (very low) to 5 (excellent) mood score',
      '  "tags": string[],      // 0-4 emotion tags from this list only: ' + VALID_TAGS.join(', '),
      '  "reflection": string   // 1 warm sentence acknowledging what they said. Max 120 chars.',
      '}',
      '',
      'Output JSON only. No markdown.',
      '',
      `User description: "${text.slice(0, 500)}"`,
    ].join('\n');

    try {
      const completion = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.5,
        max_tokens: 200,
      });

      const raw = JSON.parse(completion.choices[0]?.message?.content ?? '{}') as {
        score?: number; tags?: string[]; reflection?: string;
      };

      const score = typeof raw.score === 'number'
        ? Math.max(1, Math.min(5, Math.round(raw.score))) : 3;
      const tags = Array.isArray(raw.tags)
        ? raw.tags.filter((t): t is string => VALID_TAGS.includes(t as string)).slice(0, 4)
        : [];
      const reflection = typeof raw.reflection === 'string' ? raw.reflection.trim() : '';

      return { score, tags, reflection };
    } catch (err) {
      this.logger.warn(`Groq analyzeMoodText failed: ${(err as Error).message}`);
      return null;
    }
  }

  // -------------------- TASK PARSER --------------------

  async parseTaskDescription(description: string): Promise<{
    title: string; description: string; priority: string; dueDate: string | null;
  } | null> {
    if (!this.client) return null;

    const today = new Date().toISOString().slice(0, 10);

    const prompt = [
      `Today's date is ${today}.`,
      'The user typed a natural-language task description. Parse it into structured fields.',
      'Return a JSON object matching:',
      '{',
      '  "title": string,       // concise task title, max 60 chars',
      '  "description": string, // any extra context from the input, or empty string',
      '  "priority": "low" | "medium" | "high",',
      '  "dueDate": string | null  // ISO date YYYY-MM-DD if a date/day is mentioned, else null',
      '}',
      '',
      'Rules: infer priority from urgency words (urgent/critical/asap = high; eventually/someday = low). ',
      'Infer dueDate from relative terms like "tomorrow", "Friday", "next week", "end of month". ',
      'Output JSON only.',
      '',
      `Input: "${description.slice(0, 400)}"`,
    ].join('\n');

    try {
      const completion = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
        max_tokens: 200,
      });

      const raw = JSON.parse(completion.choices[0]?.message?.content ?? '{}') as {
        title?: string; description?: string; priority?: string; dueDate?: string | null;
      };

      return {
        title: typeof raw.title === 'string' ? raw.title.slice(0, 60) : description.slice(0, 60),
        description: typeof raw.description === 'string' ? raw.description : '',
        priority: ['low','medium','high'].includes(raw.priority ?? '') ? raw.priority! : 'medium',
        dueDate: typeof raw.dueDate === 'string' && raw.dueDate ? raw.dueDate : null,
      };
    } catch (err) {
      this.logger.warn(`Groq parseTaskDescription failed: ${(err as Error).message}`);
      return null;
    }
  }

  // -------------------- JOURNAL PROMPT GENERATOR --------------------

  async generateJournalPrompt(recentMoodAvg?: number, recentTags?: string[]): Promise<string | null> {
    if (!this.client) return null;

    const context = [
      recentMoodAvg !== undefined && `Recent average mood (1-5 scale): ${recentMoodAvg.toFixed(1)}`,
      recentTags?.length && `Recent emotion tags: ${recentTags.slice(0, 5).join(', ')}`,
    ].filter(Boolean).join('\n');

    const prompt = [
      'Generate ONE thoughtful journal prompt for a wellness app user.',
      context ? `User context:\n${context}` : 'No mood data available yet.',
      '',
      'The prompt should:',
      '- Be a single open-ended question (not a command)',
      '- Be specific to their emotional context if available',
      '- Encourage reflection without being heavy-handed',
      '- Be max 120 characters',
      '',
      'Output only the question. No quotes. No preamble.',
    ].join('\n');

    try {
      const completion = await this.client.chat.completions.create({
        model: this.modelName,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.9,
        max_tokens: 80,
      });

      const text = (completion.choices[0]?.message?.content ?? '').trim().replace(/^["']|["']$/g, '');
      return text.length > 0 ? text : null;
    } catch (err) {
      this.logger.warn(`Groq generateJournalPrompt failed: ${(err as Error).message}`);
      return null;
    }
  }
}
