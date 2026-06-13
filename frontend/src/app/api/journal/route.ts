import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';
import Groq from 'groq-sdk';

function rowToEntry(r: Record<string, unknown>) {
  return {
    entryId: r.entry_id,
    userId: r.user_id,
    content: r.content,
    sentimentScore: r.sentiment_score ?? null,
    feedbackEnglish: r.feedback_english ?? null,
    feedbackUrdu: r.feedback_urdu ?? null,
    createdAt: r.created_at,
  };
}

async function analyzeWithGroq(content: string): Promise<{
  score: number | null;
  feedbackEnglish: string | null;
  feedbackUrdu: string | null;
}> {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy-key' });
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'You are a mental health journal analyzer. Analyze the sentiment of this journal entry and respond with JSON only: {"score": number 1-10, "feedbackEnglish": "brief supportive message", "feedbackUrdu": "brief supportive message in Urdu"}',
        },
        { role: 'user', content },
      ],
    });
    const text = completion.choices[0]?.message?.content ?? '';
    const json = JSON.parse(text.trim());
    return {
      score: typeof json.score === 'number' ? json.score : null,
      feedbackEnglish: json.feedbackEnglish ?? null,
      feedbackUrdu: json.feedbackUrdu ?? null,
    };
  } catch {
    return { score: null, feedbackEnglish: null, feedbackUrdu: null };
  }
}

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const p = await req.json();

    if (p.userId !== undefined && Number(p.userId) !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (!p.content) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }

    let sentimentScore: number | null = p.sentimentScore ?? null;
    let feedbackEnglish: string | null = p.feedbackEnglish ?? null;
    let feedbackUrdu: string | null = p.feedbackUrdu ?? null;

    if (process.env.GROQ_API_KEY) {
      const result = await analyzeWithGroq(p.content);
      if (result.score !== null) sentimentScore = result.score;
      if (result.feedbackEnglish !== null) feedbackEnglish = result.feedbackEnglish;
      if (result.feedbackUrdu !== null) feedbackUrdu = result.feedbackUrdu;
    }

    const sql = getDb();
    const rows = await sql`
      INSERT INTO journal_entries (user_id, content, sentiment_score, feedback_english, feedback_urdu)
      VALUES (${userId}, ${p.content}, ${sentimentScore}, ${feedbackEnglish}, ${feedbackUrdu})
      RETURNING *
    `;
    return NextResponse.json(rowToEntry(rows[0] as Record<string, unknown>), { status: 201 });
  } catch (err) {
    console.error('POST /api/journal error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
