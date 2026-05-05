import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, Repository } from 'typeorm';
import { Reminder } from './entities/reminder.entity';
import { CreateReminderDto } from './dto/create-reminder.dto';

@Injectable()
export class RemindersService {
  constructor(
    @InjectRepository(Reminder)
    private readonly repo: Repository<Reminder>,
  ) {}

  create(dto: CreateReminderDto): Promise<Reminder> {
    const reminder = this.repo.create({
      ...dto,
      scheduledFor: dto.scheduledFor ? new Date(dto.scheduledFor) : null,
    });
    return this.repo.save(reminder);
  }

  /** All reminders for a user, unread first, newest first. */
  findByUser(userId: number): Promise<Reminder[]> {
    return this.repo.find({
      where: { userId },
      order: { isRead: 'ASC', createdAt: 'DESC' },
    });
  }

  /** Count of unread reminders for a user. */
  async unreadCount(userId: number): Promise<{ count: number }> {
    const count = await this.repo.count({ where: { userId, isRead: false } });
    return { count };
  }

  async markRead(reminderId: number, userId: number): Promise<Reminder> {
    const r = await this.repo.findOne({ where: { reminderId, userId } });
    if (!r) throw new NotFoundException('Reminder not found');
    r.isRead = true;
    return this.repo.save(r);
  }

  async markAllRead(userId: number): Promise<{ updated: number }> {
    const result = await this.repo.update({ userId, isRead: false }, { isRead: true });
    return { updated: result.affected ?? 0 };
  }

  async remove(reminderId: number, userId: number): Promise<{ message: string }> {
    const result = await this.repo.delete({ reminderId, userId });
    if (!result.affected) throw new NotFoundException('Reminder not found');
    return { message: 'Deleted' };
  }

  /**
   * Returns smart auto-reminders derived from the user's data.
   * These are ephemeral — not stored in the DB — so this endpoint
   * is cheap to call on every page load.
   */
  async getSmartReminders(userId: number): Promise<{
    id: string;
    type: string;
    title: string;
    message: string;
    urgent: boolean;
  }[]> {
    const now = new Date();
    const todayIso = now.toISOString().slice(0, 10);
    const reminders: { id: string; type: string; title: string; message: string; urgent: boolean }[] = [];

    // ── Check for overdue / due-today tasks ─────────────────────────────────
    try {
      const tasks = await this.repo.manager.query(
        `SELECT task_id, title, due_date, task_status
         FROM tasks
         WHERE user_id = $1
           AND task_status != 'completed'
           AND due_date IS NOT NULL
           AND DATE(due_date) <= $2
         ORDER BY due_date ASC
         LIMIT 5`,
        [userId, todayIso],
      ) as { task_id: number; title: string; due_date: string; task_status: string }[];

      for (const t of tasks) {
        const dueDate = new Date(t.due_date);
        const isOverdue = dueDate < now;
        reminders.push({
          id:      `task-${t.task_id}`,
          type:    'task',
          title:   isOverdue ? `⚠️ Overdue: ${t.title}` : `📋 Due today: ${t.title}`,
          message: isOverdue
            ? `This task was due on ${dueDate.toLocaleDateString()} and is still open.`
            : `Don't forget to complete this task today.`,
          urgent:  isOverdue,
        });
      }
    } catch { /* tasks table may not exist in test env */ }

    // ── Check if mood logged today ──────────────────────────────────────────
    try {
      const moodLogs = await this.repo.manager.query(
        `SELECT mood_log_id FROM mood_logs WHERE user_id = $1 AND date = $2 LIMIT 1`,
        [userId, todayIso],
      ) as { mood_log_id: number }[];

      if (moodLogs.length === 0) {
        reminders.push({
          id:      `mood-${todayIso}`,
          type:    'mood',
          title:   '💚 Log your mood today',
          message: 'You haven\'t logged your mood yet. It only takes 10 seconds.',
          urgent:  false,
        });
      }
    } catch { /* mood_logs may not exist in test env */ }

    return reminders;
  }
}
