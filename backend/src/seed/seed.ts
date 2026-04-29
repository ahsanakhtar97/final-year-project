/**
 * GrowFlow seed -- creates demo data so a fresh clone has something to show.
 *
 * Usage:  npm run seed
 *
 * Idempotent-ish: if any of the seeded users already exist (by email), the
 * script bails out early instead of duplicating rows. Drop your dev DB and
 * re-run if you want a clean slate.
 *
 * Creates:
 *   - 1 patient (demo@growflow.app / Password1) with 30 days of habit logs,
 *     5 journal entries with varied moods, 3 active goals, 6 tasks
 *   - 3 verified professionals with full profiles
 *   - 1 unverified professional (so the verified-only filter has something
 *     to filter)
 */

import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';

import { AppModule } from '../app.module';
import { Category } from '../categories/entities/category.entity';
import { Goal } from '../goals/entities/goal.entity';
import { GoalStatus } from '../goals/enums/goal-status.enum';
import { HabitLog } from '../habit-logs/entities/habit-log.entity';
import { Habit } from '../habits/entities/habit.entity';
import { JournalEntry } from '../journal/entities/journal-entry.entity';
import { Task } from '../tasks/entities/task.entity';
import { TaskStatus } from '../tasks/enums/task-status.enum';
import { UserHabit } from '../user-habits/entities/user-habit.entity';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

const DEMO_PATIENT_EMAIL = 'demo@growflow.app';
const DEMO_PASSWORD = 'Password1';

const PROFESSIONALS = [
  {
    name: 'Dr. Sara Khan',
    email: 'sara.khan@growflow.app',
    role: UserRole.PSYCHIATRIST,
    credentials: 'MBBS, FCPS (Psychiatry)',
    yearsExperience: 12,
    languages: 'English, Urdu',
    feeText: 'PKR 5,500 / session',
    bio: 'Karachi-based psychiatrist focused on adult mood and anxiety disorders. Pragmatic, plain-language approach.',
    verified: true,
  },
  {
    name: 'Hira Ahmed, PhD',
    email: 'hira.ahmed@growflow.app',
    role: UserRole.PSYCHOLOGIST,
    credentials: 'PhD Clinical Psychology',
    yearsExperience: 8,
    languages: 'English, Urdu, Punjabi',
    feeText: 'PKR 4,000 / session',
    bio: 'CBT-trained clinical psychologist. Particular interest in burnout and perfectionism in tech workers.',
    verified: true,
  },
  {
    name: 'Dr. Bilal Hussain',
    email: 'bilal.hussain@growflow.app',
    role: UserRole.PSYCHIATRIST,
    credentials: 'MBBS, MRCPsych',
    yearsExperience: 15,
    languages: 'English, Urdu',
    feeText: 'PKR 7,000 / session',
    bio: 'Adolescent and adult psychiatry. Telemedicine appointments available evenings.',
    verified: true,
  },
  {
    name: 'Mr. Test Provider',
    email: 'unverified@growflow.app',
    role: UserRole.PSYCHOLOGIST,
    credentials: 'Pending verification',
    yearsExperience: 2,
    languages: 'English',
    feeText: null,
    bio: 'New account, awaiting credential review.',
    verified: false,
  },
];

// Habits live in a category. Seed creates the category first, then attaches.
const SEED_CATEGORY_NAME = 'Wellness';

const SEED_HABITS = [
  { habitName: 'Morning meditation' },
  { habitName: 'Evening walk' },
  { habitName: 'Read 10 pages' },
  { habitName: 'Drink 2L water' },
];

const SEED_TASKS = [
  { title: 'Email Sara about agenda', status: TaskStatus.TO_DO },
  { title: 'Refactor habit-tracker page', status: TaskStatus.IN_PROGRESS },
  { title: 'Buy groceries', status: TaskStatus.COMPLETED },
  { title: 'Call mum', status: TaskStatus.TO_DO },
  { title: 'Schedule dentist', status: TaskStatus.TO_DO },
  { title: 'Submit insurance claim', status: TaskStatus.COMPLETED },
];

const SEED_JOURNAL_ENTRIES: { text: string; moodScore: number; feedback: string }[] = [
  {
    text: 'Felt scattered all morning. Once I went for a walk it eased a bit.',
    moodScore: 45,
    feedback: 'Movement seems to settle you. Worth keeping that walk a non-negotiable.',
  },
  {
    text: 'Productive day, finished the report I had been avoiding for weeks.',
    moodScore: 80,
    feedback: 'Following through on the avoided thing -- that compounds.',
  },
  {
    text: 'Tough day. Felt invisible at the team meeting.',
    moodScore: 25,
    feedback: 'That sounds heavy. One small kind thing for yourself tonight is enough.',
  },
  {
    text: 'Slept 8 hours, energy is back. Made the call I had been dreading.',
    moodScore: 75,
    feedback: 'Sleep + one hard thing done. That is a strong day.',
  },
  {
    text: 'Just okay. Nothing went wrong, nothing magical either.',
    moodScore: 55,
    feedback: 'Steady is its own kind of progress. Not every day needs to peak.',
  },
];

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });
  const ds = app.get(DataSource);

  const userRepo = ds.getRepository(User);
  const categoryRepo = ds.getRepository(Category);
  const habitRepo = ds.getRepository(Habit);
  const userHabitRepo = ds.getRepository(UserHabit);
  const habitLogRepo = ds.getRepository(HabitLog);
  const journalRepo = ds.getRepository(JournalEntry);
  const taskRepo = ds.getRepository(Task);
  const goalRepo = ds.getRepository(Goal);

  // Bail if the patient is already seeded.
  const existing = await userRepo.findOne({ where: { email: DEMO_PATIENT_EMAIL } });
  if (existing) {
    console.log(
      `Demo patient ${DEMO_PATIENT_EMAIL} already exists. Drop the DB if you want a fresh seed.`,
    );
    await app.close();
    return;
  }

  console.log('🌱 Seeding GrowFlow demo data ...');

  // Create the patient.
  const patientHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const patient = await userRepo.save(
    userRepo.create({
      name: 'Demo User',
      email: DEMO_PATIENT_EMAIL,
      password: patientHash,
      role: UserRole.PATIENT,
    }),
  );
  console.log(`  ✓ patient: ${patient.email} (password: ${DEMO_PASSWORD})`);

  // Create professionals.
  for (const p of PROFESSIONALS) {
    const hash = await bcrypt.hash(DEMO_PASSWORD, 12);
    const u = await userRepo.save(
      userRepo.create({
        name: p.name,
        email: p.email,
        password: hash,
        role: p.role,
        credentials: p.credentials,
        yearsExperience: p.yearsExperience,
        languages: p.languages,
        feeText: p.feeText,
        bio: p.bio,
        verified: p.verified,
      }),
    );
    console.log(
      `  ✓ ${p.role}: ${u.email} ${p.verified ? '(verified)' : '(unverified)'}`,
    );
  }

  // Find or create the wellness category, then create the habits inside it.
  let category = await categoryRepo.findOne({
    where: { categoryName: SEED_CATEGORY_NAME },
  });
  if (!category) {
    category = await categoryRepo.save(
      categoryRepo.create({ categoryName: SEED_CATEGORY_NAME }),
    );
  }

  const habits: Habit[] = [];
  for (const h of SEED_HABITS) {
    const created = await habitRepo.save(
      habitRepo.create({
        habitName: h.habitName,
        categoryId: category.categoryId,
      }),
    );
    habits.push(created);
  }
  const userHabits: UserHabit[] = [];
  for (const habit of habits) {
    const uh = await userHabitRepo.save(
      userHabitRepo.create({
        userId: patient.userId,
        habitId: habit.habitId,
        startDate: new Date(),
      }),
    );
    userHabits.push(uh);
  }
  console.log(`  ✓ ${habits.length} habits, all assigned to demo patient`);

  // 30 days of habit logs with realistic adherence (~70%).
  const today = new Date();
  let logCount = 0;
  for (let d = 0; d < 30; d++) {
    const day = new Date(today);
    day.setDate(today.getDate() - d);
    const isoDate = day.toISOString().slice(0, 10);
    for (const uh of userHabits) {
      if (Math.random() < 0.7) {
        await habitLogRepo.save(
          habitLogRepo.create({
            userHabit: { userHabitId: uh.userHabitId },
            date: isoDate,
            status: 'completed',
            moodScore: Math.floor(Math.random() * 5) + 3, // 3..7
          }),
        );
        logCount++;
      }
    }
  }
  console.log(`  ✓ ${logCount} habit logs across the last 30 days`);

  // Journal entries spread over the last 10 days. The seed table uses
  // `moodScore` on a 0..100 scale for readability; the entity stores
  // sentiment in [-1, 1], so we map across.
  for (let i = 0; i < SEED_JOURNAL_ENTRIES.length; i++) {
    const entry = SEED_JOURNAL_ENTRIES[i];
    const created = new Date(today);
    created.setDate(today.getDate() - i * 2);
    const sentiment = (entry.moodScore - 50) / 50; // 0..100 -> -1..1
    await journalRepo.save(
      journalRepo.create({
        userId: patient.userId,
        content: entry.text,
        sentimentScore: sentiment,
        feedbackEnglish: entry.feedback,
        feedbackUrdu: null,
        createdAt: created,
      }),
    );
  }
  console.log(`  ✓ ${SEED_JOURNAL_ENTRIES.length} journal entries`);

  // Tasks. `description` is required at the DB level so we always pass one.
  for (const t of SEED_TASKS) {
    await taskRepo.save(
      taskRepo.create({
        userId: patient.userId,
        title: t.title,
        description: '',
        taskStatus: t.status,
      }),
    );
  }
  console.log(`  ✓ ${SEED_TASKS.length} tasks`);

  // Goals.
  await goalRepo.save([
    goalRepo.create({
      userId: patient.userId,
      title: 'Read 12 books this year',
      description: 'One book per month, fiction or non-fiction.',
      targetValue: 12,
      currentValue: 4,
      unit: 'books',
      status: GoalStatus.ACTIVE,
    }),
    goalRepo.create({
      userId: patient.userId,
      title: 'Run a 5K',
      description: 'Build up from 1K, no pressure on time.',
      targetValue: 5,
      currentValue: 2,
      unit: 'km',
      status: GoalStatus.ACTIVE,
    }),
    goalRepo.create({
      userId: patient.userId,
      title: 'Meditate 100 days',
      targetValue: 100,
      currentValue: 21,
      unit: 'days',
      status: GoalStatus.ACTIVE,
    }),
  ]);
  console.log('  ✓ 3 active goals');

  console.log('\n🌱 Seed complete.');
  console.log(`   Login as patient: ${DEMO_PATIENT_EMAIL} / ${DEMO_PASSWORD}`);
  console.log(`   Login as provider: sara.khan@growflow.app / ${DEMO_PASSWORD}`);

  await app.close();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('Seed failed:', err);
  process.exit(1);
});
