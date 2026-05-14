import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { description } = body;

  if (!description) {
    return NextResponse.json({ error: 'description is required' }, { status: 400 });
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'Parse this task description and respond with JSON only: {"title": "concise title", "description": "details", "priority": "low"|"medium"|"high", "dueDate": "YYYY-MM-DD or null"}',
        },
        { role: 'user', content: description },
      ],
      temperature: 0.3,
      max_tokens: 256,
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');
    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({
      title: parsed.title,
      description: parsed.description,
      priority: parsed.priority,
      dueDate: parsed.dueDate,
    });
  } catch {
    return NextResponse.json({
      title: (description as string).slice(0, 60),
      description: description,
      priority: 'medium',
      dueDate: null,
    });
  }
}
