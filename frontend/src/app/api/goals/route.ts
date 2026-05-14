import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

function rowToGoal(r: Record<string, unknown>) {
  return {
    goalId: r.goal_id,
    userId: r.user_id,
    title: r.title,
    description: r.description ?? null,
    targetValue: r.target_value,
    currentValue: r.current_value,
    unit: r.unit ?? null,
    status: r.status,
    deadline: r.deadline ?? null,
    linkedHabitId: r.linked_habit_id ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { title, description, target_value, unit, deadline, linked_habit_id, status } = body;

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const resolvedTargetValue = target_value ?? 1;
    const resolvedStatus = status ?? 'in_progress';

    const sql = getDb();
    const rows = await sql`
      INSERT INTO goals (user_id, title, description, target_value, unit, deadline, linked_habit_id, status)
      VALUES (
        ${userId},
        ${title},
        ${description ?? null},
        ${resolvedTargetValue},
        ${unit ?? null},
        ${deadline ?? null},
        ${linked_habit_id ?? null},
        ${resolvedStatus}
      )
      RETURNING *
    `;
    return NextResponse.json(rowToGoal(rows[0] as Record<string, unknown>), { status: 201 });
  } catch (err) {
    console.error('POST /api/goals error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
