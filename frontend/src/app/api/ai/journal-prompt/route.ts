import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { recentMoodAvg, recentTags } = body;

  const userMessage =
    [
      recentMoodAvg !== undefined ? `Recent mood average: ${recentMoodAvg}/10` : null,
      Array.isArray(recentTags) && recentTags.length
        ? `Recent emotion tags: ${(recentTags as string[]).join(', ')}`
        : null,
    ]
      .filter(Boolean)
      .join('\n') || 'No recent mood data available.';

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            "Generate a single thoughtful journal prompt for a mental wellness app. Consider the user's recent mood and tags. Respond with just the prompt text, no quotes.",
        },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.8,
      max_tokens: 128,
    });

    const prompt = completion.choices[0]?.message?.content?.trim() ?? '';
    return NextResponse.json({ prompt });
  } catch {
    return NextResponse.json({ prompt: 'What is one thing you are grateful for today?' });
  }
}
