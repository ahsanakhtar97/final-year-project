import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

async function requireAdmin(req: NextRequest): Promise<boolean> {
  const userId = getUserIdFromRequest(req);
  if (!userId) return false;
  const sql = getDb();
  const rows = await sql`SELECT role FROM users WHERE user_id = ${userId} LIMIT 1`;
  return rows[0]?.role === 'admin';
}

type Params = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  const targetId = Number(id);
  if (isNaN(targetId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const sql = getDb();
    const deleted = await sql`
      DELETE FROM appointments WHERE appointment_id = ${targetId} RETURNING appointment_id
    `;

    if (!deleted.length) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Appointment deleted', appointmentId: deleted[0].appointment_id });
  } catch (err) {
    console.error('DELETE /api/admin/appointments/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
