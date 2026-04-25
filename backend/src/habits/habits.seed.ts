import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from '../categories/entities/category.entity';
import { Habit } from './entities/habit.entity';

/**
 * Seeds default categories and habits the first time the app boots
 * against an empty database. Idempotent: only inserts what's missing.
 *
 * This prevents the "empty habit tracker" problem where new users have
 * no categories or habit templates to choose from.
 */
@Injectable()
export class HabitsSeedService implements OnModuleInit {
  private readonly logger = new Logger(HabitsSeedService.name);

  // Default seed data. Order matters for deterministic IDs in fresh DBs.
  private readonly DEFAULT_CATEGORIES = [
    'Health',
    'Productivity',
    'Learning',
    'Lifestyle',
    'Finance',
    'Mental Wellbeing',
  ];

  // habit name -> category name
  private readonly DEFAULT_HABITS: Array<{ name: string; category: string }> = [
    { name: 'Drink 8 glasses of water', category: 'Health' },
    { name: 'Walk 10,000 steps', category: 'Health' },
    { name: 'Sleep 7+ hours', category: 'Health' },
    { name: 'Eat a balanced meal', category: 'Health' },

    { name: 'Plan tomorrow before bed', category: 'Productivity' },
    { name: 'Deep work for 60 min', category: 'Productivity' },
    { name: 'Inbox to zero', category: 'Productivity' },

    { name: 'Read for 20 minutes', category: 'Learning' },
    { name: 'Practice a new skill', category: 'Learning' },
    { name: 'Watch a tutorial', category: 'Learning' },

    { name: 'Tidy your space', category: 'Lifestyle' },
    { name: 'No screens after 10pm', category: 'Lifestyle' },

    { name: 'Track expenses', category: 'Finance' },
    { name: 'Save before you spend', category: 'Finance' },

    { name: 'Meditate for 10 minutes', category: 'Mental Wellbeing' },
    { name: 'Journal your thoughts', category: 'Mental Wellbeing' },
    { name: 'Practice gratitude', category: 'Mental Wellbeing' },
  ];

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Habit)
    private readonly habitRepository: Repository<Habit>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.seedCategories();
      await this.seedHabits();
    } catch (err) {
      // Seeding is best-effort -- never crash app boot over seed errors.
      this.logger.error('Habit seeding failed', err as Error);
    }
  }

  private async seedCategories(): Promise<void> {
    const existing = await this.categoryRepository.find();
    const existingNames = new Set(existing.map((c) => c.categoryName));

    const toInsert = this.DEFAULT_CATEGORIES.filter(
      (name) => !existingNames.has(name),
    ).map((categoryName) => this.categoryRepository.create({ categoryName }));

    if (toInsert.length === 0) return;

    await this.categoryRepository.save(toInsert);
    this.logger.log(
      `Seeded ${toInsert.length} default categor${toInsert.length === 1 ? 'y' : 'ies'}`,
    );
  }

  private async seedHabits(): Promise<void> {
    // Look up by name -> id once, post category seeding.
    const allCategories = await this.categoryRepository.find();
    const idByName = new Map(
      allCategories.map((c) => [c.categoryName, c.categoryId] as const),
    );

    const existingHabits = await this.habitRepository.find();
    const existingHabitNames = new Set(
      existingHabits.map((h) => h.habitName.toLowerCase()),
    );

    const toInsert: Habit[] = [];
    for (const def of this.DEFAULT_HABITS) {
      if (existingHabitNames.has(def.name.toLowerCase())) continue;
      const categoryId = idByName.get(def.category);
      if (!categoryId) continue; // category missing -- skip silently
      toInsert.push(
        this.habitRepository.create({
          habitName: def.name,
          categoryId,
        }),
      );
    }

    if (toInsert.length === 0) return;

    await this.habitRepository.save(toInsert);
    this.logger.log(
      `Seeded ${toInsert.length} default habit${toInsert.length === 1 ? '' : 's'}`,
    );
  }
}
