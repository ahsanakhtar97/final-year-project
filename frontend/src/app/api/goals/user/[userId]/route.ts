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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Ignore the userId param — always use the authenticated user's ID
  void params;

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM goals
      WHERE user_id = ${userId}
      ORDER BY status ASC, created_at DESC
    `;
    return NextResponse.json(rows.map((r) => rowToGoal(r as Record<string, unknown>)));
  } catch (err) {
    console.error('GET /api/goals/user/[userId] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
