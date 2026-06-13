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
    const existing = await sql`SELECT goal_id FROM goals WHERE goal_id = ${goalId} AND user_id = ${userId}`;
    if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const { title, description, target_value, current_value, unit, status, deadline } = body;

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (title !== undefined) { updates.push(`title = $${idx++}`); values.push(title); }
    if (description !== undefined) { updates.push(`description = $${idx++}`); values.push(description); }
    if (target_value !== undefined) { updates.push(`target_value = $${idx++}`); values.push(target_value); }
    if (current_value !== undefined) { updates.push(`current_value = $${idx++}`); values.push(current_value); }
    if (unit !== undefined) { updates.push(`unit = $${idx++}`); values.push(unit); }
    if (status !== undefined) { updates.push(`status = $${idx++}`); values.push(status); }
    if (deadline !== undefined) { updates.push(`deadline = $${idx++}`); values.push(deadline); }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      const rows = await sql`SELECT * FROM goals WHERE goal_id = ${goalId} AND user_id = ${userId}`;
      return NextResponse.json(rowToGoal(rows[0] as Record<string, unknown>));
    }

    values.push(goalId, userId);
    const query = `UPDATE goals SET ${updates.join(', ')} WHERE goal_id = $${idx++} AND user_id = $${idx++} RETURNING *`;
    const rows = await (sql as any)(query, values);
    return NextResponse.json(rowToGoal(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('PATCH /api/goals/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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
    const existing = await sql`SELECT goal_id FROM goals WHERE goal_id = ${goalId} AND user_id = ${userId}`;
    if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await sql`DELETE FROM goals WHERE goal_id = ${goalId} AND user_id = ${userId}`;
    return NextResponse.json({ message: 'Goal deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/goals/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
