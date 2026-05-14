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

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT * FROM tasks WHERE user_id = ${userId} ORDER BY created_at DESC
    `;
    return NextResponse.json(rows.map((r) => rowToTask(r as Record<string, unknown>)));
  } catch (err) {
    console.error('GET /api/tasks error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { title, description, priority, due_date, status } = body;

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const resolvedPriority = priority ?? 'medium';
    const resolvedStatus = status ?? 'pending';

    const sql = getDb();
    const rows = await sql`
      INSERT INTO tasks (user_id, title, description, priority, due_date, status)
      VALUES (
        ${userId},
        ${title},
        ${description ?? null},
        ${resolvedPriority},
        ${due_date ?? null},
        ${resolvedStatus}
      )
      RETURNING *
    `;
    return NextResponse.json(rowToTask(rows[0] as Record<string, unknown>), { status: 201 });
  } catch (err) {
    console.error('POST /api/tasks error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
