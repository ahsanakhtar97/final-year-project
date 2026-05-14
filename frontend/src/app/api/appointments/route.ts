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
  };
}

export async function POST(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { professionalId, proposedAt, durationMinutes, patientNote } = body;

    if (!professionalId || !proposedAt) {
      return NextResponse.json({ error: 'professionalId and proposedAt are required' }, { status: 400 });
    }

    const sql = getDb();
    const rows = await sql`
      INSERT INTO appointments (patient_id, professional_id, proposed_at, duration_minutes, patient_note, status)
      VALUES (
        ${userId},
        ${professionalId},
        ${proposedAt},
        ${durationMinutes ?? 60},
        ${patientNote ?? null},
        'pending'
      )
      RETURNING *
    `;

    return NextResponse.json(rowToAppt(rows[0] as Record<string, unknown>), { status: 201 });
  } catch (err) {
    console.error('POST /api/appointments error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
