import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { HabitLog } from '../habit-logs/entities/habit-log.entity';
import { JournalEntry } from '../journal/entities/journal-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([HabitLog, JournalEntry])],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
