import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'dummy-key' });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { text } = body;

  if (!text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'Analyze the mood of the following text and respond with JSON only: {"score": number 1-10, "tags": ["array of emotion tags"], "reflection": "brief empathetic reflection"}',
        },
        { role: 'user', content: text },
      ],
      temperature: 0.5,
      max_tokens: 256,
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      score: parsed.score,
      tags: parsed.tags,
      reflection: parsed.reflection,
    });
  } catch {
    return NextResponse.json({ score: 5, tags: ['neutral'], reflection: 'Unable to analyze at this time.' });
  }
}
