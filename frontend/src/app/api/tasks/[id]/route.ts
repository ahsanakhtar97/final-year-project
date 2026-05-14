import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

function rowToTask(r: Record<string, unknown>) {
  return {
    taskId: r.task_id,
    userId: r.user_id,
    title: r.title,
    description: r.description ?? null,
    status: r.status,
    priority: r.priority,
    dueDate: r.due_date ?? null,
    focusMinutes: r.focus_minutes ?? 0,
    completedAt: r.completed_at ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const taskId = Number(id);
    if (isNaN(taskId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const sql = getDb();
    const rows = await sql`SELECT * FROM tasks WHERE task_id = ${taskId} AND user_id = ${userId}`;
    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(rowToTask(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('GET /api/tasks/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await params;
    const taskId = Number(id);
    if (isNaN(taskId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const sql = getDb();
    const existing = await sql`SELECT * FROM tasks WHERE task_id = ${taskId} AND user_id = ${userId}`;
    if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const { title, description, priority, status, due_date } = body;

    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (title !== undefined) { updates.push(`title = $${idx++}`); values.push(title); }
    if (description !== undefined) { updates.push(`description = $${idx++}`); values.push(description); }
    if (priority !== undefined) { updates.push(`priority = $${idx++}`); values.push(priority); }
    if (due_date !== undefined) { updates.push(`due_date = $${idx++}`); values.push(due_date); }
    if (status !== undefined) {
      updates.push(`status = $${idx++}`);
      values.push(status);
      if (status === 'completed') {
        updates.push(`completed_at = NOW()`);
      } else {
        updates.push(`completed_at = NULL`);
      }
    }

    updates.push(`updated_at = NOW()`);

    if (updates.length === 1) {
      // Only updated_at, nothing meaningful changed
      return NextResponse.json(rowToTask(existing[0] as Record<string, unknown>));
    }

    values.push(taskId, userId);
    const query = `UPDATE tasks SET ${updates.join(', ')} WHERE task_id = $${idx++} AND user_id = $${idx++} RETURNING *`;
    const rows = await sql(query, values);
    return NextResponse.json(rowToTask(rows[0] as Record<string, unknown>));
  } catch (err) {
    console.error('PATCH /api/tasks/[id] error:', err);
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
    const taskId = Number(id);
    if (isNaN(taskId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

    const sql = getDb();
    const existing = await sql`SELECT task_id FROM tasks WHERE task_id = ${taskId} AND user_id = ${userId}`;
    if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await sql`DELETE FROM tasks WHERE task_id = ${taskId} AND user_id = ${userId}`;
    return NextResponse.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('DELETE /api/tasks/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
