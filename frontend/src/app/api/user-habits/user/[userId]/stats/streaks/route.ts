import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

function calcStreaks(dates: string[]): { currentStreak: number; longestStreak: number } {
  if (!dates.length) return { currentStreak: 0, longestStreak: 0 };

  // Sort descending
  const sorted = [...dates].sort((a, b) => b.localeCompare(a));

  const today = new Date().toISOString().split('T')[0];

  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;

  // Current streak: consecutive days from today backwards
  const todayOrYesterday = sorted[0] === today || sorted[0] === getPrevDay(today);
  if (todayOrYesterday) {
    currentStreak = 1;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === getPrevDay(sorted[i - 1])) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Longest streak: scan all
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === getPrevDay(sorted[i - 1])) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak };
}

function getPrevDay(dateStr: string): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const tokenUserId = getUserIdFromRequest(req);
  if (!tokenUserId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { userId } = await params;
    const uid = Number(userId);
    if (isNaN(uid)) return NextResponse.json({ error: 'Invalid userId' }, { status: 400 });
    if (uid !== tokenUserId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const sql = getDb();
    const rows = await sql`
      SELECT uh.user_habit_id, h.habit_id, h.habit_name, hl.date::text AS date
      FROM user_habits uh
      JOIN habits h ON h.habit_id = uh.habit_id
      LEFT JOIN habit_logs hl ON hl.user_habit_id = uh.user_habit_id AND hl.status = 'completed'
      WHERE uh.user_id = ${uid}
      ORDER BY uh.user_habit_id, hl.date DESC
    `;

    // Group by habit
    const map = new Map<number, { habitId: number; habitName: string; dates: string[] }>();
    for (const r of rows) {
      const row = r as Record<string, unknown>;
      const hid = row.habit_id as number;
      if (!map.has(hid)) {
        map.set(hid, { habitId: hid, habitName: row.habit_name as string, dates: [] });
      }
      if (row.date) {
        map.get(hid)!.dates.push(row.date as string);
      }
    }

    const result = Array.from(map.values()).map(({ habitId, habitName, dates }) => {
      const { currentStreak, longestStreak } = calcStreaks(dates);
      return { habitId, habitName, currentStreak, longestStreak };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error('GET /api/user-habits/user/[userId]/stats/streaks error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
