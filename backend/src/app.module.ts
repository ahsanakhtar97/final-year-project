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
import { GoalsModule } from './goals/goals.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { ProfessionalsModule } from './professionals/professionals.module';
import { DashboardController } from './dashboard.controller';
import { validateEnv } from './common/env.validation';
import { GamificationModule } from './gamification/gamification.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ReportsModule } from './reports/reports.module';
import { BuddiesModule } from './buddies/buddies.module';
import { AdminModule } from './admin/admin.module';
import { SleepModule } from './sleep/sleep.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      // Pick up .env.{environment} with .env as fallback.
      envFilePath: [`.env.${process.env.NODE_ENV ?? 'development'}`, '.env'],
    }),

    // Global rate limiting acts as a coarse abuse net. The real brute-force
    // protection lives on per-route @Throttle() decorators (login 5/min,
    // register 3/min). The global ceiling is intentionally huge in dev so
    // dashboard fan-outs + React StrictMode + Fast Refresh never trip it.
    // The startup banner below logs the active value so it's obvious from
    // the console when the new config is live after a restart.
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit:
          process.env.NODE_ENV === 'production'
            ? 6000
            : 1_000_000, // dev: effectively unlimited
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
    GoalsModule,
    AppointmentsModule,
    ProfessionalsModule,
    GamificationModule,
    AnalyticsModule,
    ReportsModule,
    BuddiesModule,
    AdminModule,
    SleepModule,
    ScheduleModule.forRoot(),
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
