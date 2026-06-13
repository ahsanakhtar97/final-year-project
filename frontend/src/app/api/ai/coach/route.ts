import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/db';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy-key' });

const FALLBACK: { reply: string; suggestions: string[]; tone: 'encourage' | 'celebrate' | 'reset' } = {
  reply: 'Keep going — every small step counts on your wellness journey!',
  suggestions: [
    'Take a 5-minute mindfulness break',
    'Log your mood to track your progress',
    'Complete one pending habit today',
  ],
  tone: 'encourage',
};

export async function POST(req: NextRequest) {
  const tokenUserId = getUserIdFromRequest(req);
  if (tokenUserId === null) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { context, message } = body;

  const contextSummary = [
    `User context:`,
    `- Open tasks: ${context?.openTasks ?? 0}`,
    `- Tasks completed (last 7 days): ${context?.tasksCompleted7d ?? 0}`,
    `- Recent mood average: ${context?.recentMoodAvg ?? 'N/A'}`,
    `- Best streak: ${context?.bestStreak ?? 0}`,
    `- Focus minutes today: ${context?.focusMinutesToday ?? 0}`,
    `- Habits done today: ${context?.habitsDoneToday ?? 0} / ${context?.habitsTotalToday ?? 0}`,
    message ? `\nUser message: ${message}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are GrowFlow\'s personal wellness coach. You support users with their mental health, habits and productivity. Be warm, encouraging and concise. Respond with JSON: {"reply": "string", "suggestions": ["string", ...max 3], "tone": "encourage"|"celebrate"|"reset"}',
        },
        { role: 'user', content: contextSummary },
      ],
      temperature: 0.7,
      max_tokens: 512,
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json(FALLBACK);
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(FALLBACK);
  }
}
