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

export async function GET(req: NextRequest) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const sql = getDb();
    const rows = await sql`
      SELECT a.*,
        p.name  AS patient_name,  p.email  AS patient_email,  p.role  AS patient_role,
        pr.name AS professional_name, pr.email AS professional_email, pr.role AS professional_role
      FROM appointments a
      LEFT JOIN users p  ON p.user_id  = a.patient_id
      LEFT JOIN users pr ON pr.user_id = a.professional_id
      WHERE a.patient_id = ${userId} OR a.professional_id = ${userId}
      ORDER BY a.proposed_at DESC
    `;

    return NextResponse.json(rows.map(r => rowToAppt(r as Record<string, unknown>)));
  } catch (err) {
    console.error('GET /api/appointments/mine error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
