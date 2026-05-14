import { NextRequest, NextResponse } from 'next/server';
import { getDb, getUserIdFromRequest } from '@/lib/db';

export async function GET(req: NextRequest) {
  const tokenUserId = getUserIdFromRequest(req);
  const { searchParams } = new URL(req.url);
  const userId = Number(searchParams.get('userId'));

  if (!userId || isNaN(userId)) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }
  if (tokenUserId === null || tokenUserId !== userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sql = getDb();

  const [moodRows, taskRows, habitRows] = await Promise.all([
    sql`SELECT * FROM mood_logs WHERE user_id = ${userId} AND date = CURRENT_DATE`,
    sql`SELECT COUNT(*) AS count FROM tasks WHERE user_id = ${userId} AND status != 'completed' AND due_date < NOW()`,
    sql`
      SELECT COUNT(DISTINCT uh.habit_id) AS count
      FROM user_habits uh
      JOIN habit_logs hl ON hl.user_habit_id = uh.user_habit_id
      WHERE uh.user_id = ${userId} AND hl.date = CURRENT_DATE
    `,
  ]);

  const reminders: Array<{ id: string; type: string; title: string; message: string; urgent: boolean }> = [];

  const hasMoodToday = moodRows.length > 0;
  if (!hasMoodToday) {
    reminders.push({
      id: 'mood-1',
      type: 'mood',
      title: 'Log your mood',
      message: "You haven't logged your mood today!",
      urgent: false,
    });
  }

  const overdueCount = Number(taskRows[0]?.count ?? 0);
  if (overdueCount > 0) {
    reminders.push({
      id: 'task-1',
      type: 'task',
      title: 'Overdue tasks',
      message: `You have ${overdueCount} overdue task(s). Let's tackle them!`,
      urgent: true,
    });
  }

  const habitCount = Number(habitRows[0]?.count ?? 0);
  const currentHour = new Date().getHours();
  if (habitCount < 3 && currentHour >= 18) {
    reminders.push({
      id: 'habit-1',
      type: 'habit',
      title: 'Habits pending',
      message: "Don't forget your habits for today!",
      urgent: false,
    });
  }

  return NextResponse.json(reminders);
}
