import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

async function requireAdmin(req: NextRequest): Promise<boolean> {
  const userId = getUserIdFromRequest(req);
  if (!userId) return false;
  const sql = getDb();
  const rows = await sql`SELECT role FROM users WHERE user_id = ${userId} LIMIT 1`;
  return rows[0]?.role === 'admin';
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sql = getDb();

    const [
      totalUsers,
      patients,
      psychiatrists,
      psychologists,
      admins,
      verifiedDoctors,
      pendingDoctors,
      totalAppts,
      pendingAppts,
      confirmedAppts,
      completedAppts,
      cancelledAppts,
      declinedAppts,
      newSignups,
    ] = await Promise.all([
      sql`SELECT COUNT(*)::int AS count FROM users`,
      sql`SELECT COUNT(*)::int AS count FROM users WHERE role = 'patient'`,
      sql`SELECT COUNT(*)::int AS count FROM users WHERE role = 'psychiatrist'`,
      sql`SELECT COUNT(*)::int AS count FROM users WHERE role = 'psychologist'`,
      sql`SELECT COUNT(*)::int AS count FROM users WHERE role = 'admin'`,
      sql`SELECT COUNT(*)::int AS count FROM users WHERE role IN ('psychiatrist','psychologist') AND verified = true`,
      sql`SELECT COUNT(*)::int AS count FROM users WHERE role IN ('psychiatrist','psychologist') AND (verified = false OR verified IS NULL)`,
      sql`SELECT COUNT(*)::int AS count FROM appointments`,
      sql`SELECT COUNT(*)::int AS count FROM appointments WHERE status = 'pending'`,
      sql`SELECT COUNT(*)::int AS count FROM appointments WHERE status = 'confirmed'`,
      sql`SELECT COUNT(*)::int AS count FROM appointments WHERE status = 'completed'`,
      sql`SELECT COUNT(*)::int AS count FROM appointments WHERE status = 'cancelled'`,
      sql`SELECT COUNT(*)::int AS count FROM appointments WHERE status = 'declined'`,
      sql`SELECT COUNT(*)::int AS count FROM users WHERE created_at >= NOW() - INTERVAL '7 days'`,
    ]);

    return NextResponse.json({
      users: {
        total: totalUsers[0].count,
        patients: patients[0].count,
        psychiatrists: psychiatrists[0].count,
        psychologists: psychologists[0].count,
        admins: admins[0].count,
      },
      doctors: {
        verified: verifiedDoctors[0].count,
        pendingVerification: pendingDoctors[0].count,
      },
      appointments: {
        total: totalAppts[0].count,
        pending: pendingAppts[0].count,
        confirmed: confirmedAppts[0].count,
        completed: completedAppts[0].count,
        cancelled: cancelledAppts[0].count,
        declined: declinedAppts[0].count,
      },
      growth: {
        newSignups7Days: newSignups[0].count,
      },
    });
  } catch (err) {
    console.error('GET /api/admin/stats error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
