import { Module } from '@nestjs/common';
import { HabitLogsService } from './habit-logs.service';
import { HabitLogsController } from './habit-logs.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HabitLog } from './entities/habit-log.entity';
@Module({
  imports: [TypeOrmModule.forFeature([HabitLog])], // or MoodLog
  controllers: [HabitLogsController],
  providers: [HabitLogsService],
  exports: [HabitLogsService], // 👈 ADD THIS
})
export class HabitLogsModule {}