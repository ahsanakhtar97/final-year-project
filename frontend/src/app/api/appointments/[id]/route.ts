import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

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
    updatedAt: r.updated_at ?? null,
    patient: r.patient_name != null ? {
      userId: r.patient_id,
      name: r.patient_name,
      email: r.patient_email,
      role: r.patient_role,
    } : null,
    professional: r.professional_name != null ? {
      userId: r.professional_id,
      name: r.professional_name,
      email: r.professional_email,
      role: r.professional_role,
    } : null,
  };
}

type Params = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: Params) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const apptId = Number(id);
  if (isNaN(apptId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT a.*,
        p.name  AS patient_name,  p.email  AS patient_email,  p.role  AS patient_role,
        pr.name AS professional_name, pr.email AS professional_email, pr.role AS professional_role
      FROM appointments a
      LEFT JOIN users p  ON p.user_id  = a.patient_id
      LEFT JOIN users pr ON pr.user_id = a.professional_id
      WHERE a.appointment_id = ${apptId}
      LIMIT 1
    `;

    if (!rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const row = rows[0] as Record<string, unknown>;
    if (row.patient_id !== userId && row.professional_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(rowToAppt(row));
  } catch (err) {
    console.error('GET /api/appointments/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const apptId = Number(id);
  if (isNaN(apptId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const sql = getDb();

    // Verify ownership
    const existing = await sql`
      SELECT patient_id, professional_id FROM appointments WHERE appointment_id = ${apptId} LIMIT 1
    `;
    if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const row = existing[0] as Record<string, unknown>;
    if (row.patient_id !== userId && row.professional_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { status, proposedAt, professionalNote } = body;

    const updated = await sql`
      UPDATE appointments
      SET
        status            = COALESCE(${status ?? null}, status),
        proposed_at       = COALESCE(${proposedAt ?? null}::timestamptz, proposed_at),
        professional_note = COALESCE(${professionalNote ?? null}, professional_note),
        updated_at        = NOW()
      WHERE appointment_id = ${apptId}
      RETURNING *
    `;

    return NextResponse.json(rowToAppt(updated[0] as Record<string, unknown>));
  } catch (err) {
    console.error('PATCH /api/appointments/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const apptId = Number(id);
  if (isNaN(apptId)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });

  try {
    const sql = getDb();

    const existing = await sql`
      SELECT patient_id, professional_id FROM appointments WHERE appointment_id = ${apptId} LIMIT 1
    `;
    if (!existing.length) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const row = existing[0] as Record<string, unknown>;
    if (row.patient_id !== userId && row.professional_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await sql`DELETE FROM appointments WHERE appointment_id = ${apptId}`;
    return NextResponse.json({ message: 'Deleted' });
  } catch (err) {
    console.error('DELETE /api/appointments/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
