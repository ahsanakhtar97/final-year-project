import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface DayData {
  date: string;
  habitsCompleted: number;
  moodScore: number | null;
  sleepHours?: number | null;
  tasksCompleted?: number;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { days, totalHabitLogs, totalJournalEntries } = body;

  if (!days || !Array.isArray(days)) {
    return NextResponse.json([]);
  }

  const daysWithMood = (days as DayData[]).filter((d) => d.moodScore !== null);
  const avgMood =
    daysWithMood.length > 0
      ? (daysWithMood.reduce((sum, d) => sum + Number(d.moodScore), 0) / daysWithMood.length).toFixed(1)
      : 'N/A';

  const avgHabits =
    days.length > 0
      ? (
          (days as DayData[]).reduce((sum, d) => sum + Number(d.habitsCompleted), 0) / days.length
        ).toFixed(1)
      : 0;

  const userMessage = [
    `Wellness data summary (last ${days.length} days):`,
    `- Average mood score: ${avgMood}/10`,
    `- Average daily habits completed: ${avgHabits}`,
    `- Total habit logs: ${totalHabitLogs}`,
    `- Total journal entries: ${totalJournalEntries}`,
  ].join('\n');

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'Analyze this wellness data and return JSON array of insights: [{"title": "string", "insight": "string", "type": "positive"|"neutral"|"warning"}] (max 4 insights)',
        },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.6,
      max_tokens: 512,
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return NextResponse.json([]);
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(Array.isArray(parsed) ? parsed.slice(0, 4) : []);
  } catch {
    return NextResponse.json([]);
  }
}
