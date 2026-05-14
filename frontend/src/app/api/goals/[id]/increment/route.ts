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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const goalId = Number(id);
    if (isNaN(goalId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const sql = getDb();
    const existing = await sql`SELECT * FROM goals WHERE goal_id = ${goalId} AND user_id = ${userId}`;
    if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const current = existing[0] as Record<string, unknown>;
    const newValue = Number(current.current_value) + 1;
    const targetValue = Number(current.target_value);
    const newStatus = newValue >= targetValue ? 'completed' : current.status;

    const rows = await sql`
      UPDATE goals
      SET current_value = ${newValue}, status = ${newStatus}, updated_at = NOW()
      WHERE goal_id = ${goalId} AND user_id = ${userId}
      RETURNING *
    `;
    return NextResponse.json(rowToGoal(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('PATCH /api/goals/[id]/increment error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
