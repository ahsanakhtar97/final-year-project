import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

async function requireAdmin(req: NextRequest): Promise<boolean> {
  const userId = getUserIdFromRequest(req);
  if (!userId) return false;
  const sql = getDb();
  const rows = await sql`SELECT role FROM users WHERE user_id = ${userId} LIMIT 1`;
  return rows[0]?.role === 'admin';
}

function rowToAppt(r: Record<string, unknown>) {
  return {
    appointmentId: r.appointment_id,
    patientId: r.patient_id,
    professionalId: r.professional_id,
    proposedAt: r.proposed_at,
    durationMinutes: r.duration_minutes,
    status: r.status,
    patientNote: r.patient_note ?? null,
    professionalNote: r.professional_note ?? null,
    createdAt: r.created_at,
    patient: r.patient_name
      ? { userId: r.patient_id, name: r.patient_name, email: r.patient_email }
      : undefined,
    professional: r.professional_name
      ? { userId: r.professional_id, name: r.professional_name, email: r.professional_email }
      : undefined,
  };
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status') ?? '';
  const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
  const limit = Math.max(1, Number(searchParams.get('limit') ?? '15'));
  const offset = (page - 1) * limit;

  try {
    const sql = getDb();

    let rows: Record<string, unknown>[];
    let countRows: Record<string, unknown>[];

    if (status) {
      rows = await sql`
        SELECT
          a.appointment_id, a.patient_id, a.professional_id, a.proposed_at,
          a.duration_minutes, a.status, a.patient_note, a.professional_note, a.created_at,
          p.name  AS patient_name,      p.email  AS patient_email,
          pr.name AS professional_name, pr.email AS professional_email
        FROM appointments a
        LEFT JOIN users p  ON p.user_id  = a.patient_id
        LEFT JOIN users pr ON pr.user_id = a.professional_id
        WHERE a.status = ${status}
        ORDER BY a.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as Record<string, unknown>[];
      countRows = await sql`
        SELECT COUNT(*)::int AS count FROM appointments WHERE status = ${status}
      ` as Record<string, unknown>[];
    } else {
      rows = await sql`
        SELECT
          a.appointment_id, a.patient_id, a.professional_id, a.proposed_at,
          a.duration_minutes, a.status, a.patient_note, a.professional_note, a.created_at,
          p.name  AS patient_name,      p.email  AS patient_email,
          pr.name AS professional_name, pr.email AS professional_email
        FROM appointments a
        LEFT JOIN users p  ON p.user_id  = a.patient_id
        LEFT JOIN users pr ON pr.user_id = a.professional_id
        ORDER BY a.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      ` as Record<string, unknown>[];
      countRows = await sql`
        SELECT COUNT(*)::int AS count FROM appointments
      ` as Record<string, unknown>[];
    }

    const total = countRows[0].count as number;

    return NextResponse.json({
      appointments: rows.map(rowToAppt),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('GET /api/admin/appointments error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
