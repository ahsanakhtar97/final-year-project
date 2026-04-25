import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { TasksModule } from './tasks/tasks.module';
import { CategoriesModule } from './categories/categories.module';
import { HabitsModule } from './habits/habits.module';
import { UserHabitsModule } from './user-habits/user-habits.module';
import { HabitLogsModule } from './habit-logs/habit-logs.module';
import { AiModule } from './ai/ai.module';
import { JournalModule } from './journal/journal.module';
import { DashboardController } from './dashboard.controller';
import { validateEnv } from './common/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      // Pick up .env.{environment} with .env as fallback.
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
    }),

    // Global rate limiting. Auth endpoints layer a stricter guard on top.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000, // 1 minute
        limit: 120, // 120 requests per minute per IP
      },
    ]),

    DatabaseModule,
    UsersModule,
    AuthModule,
    TasksModule,
    CategoriesModule,
    HabitsModule,
    UserHabitsModule,
    HabitLogsModule,
    AiModule,
    JournalModule,
  ],
  controllers: [AppController, DashboardController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
