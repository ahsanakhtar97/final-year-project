import { Module } from '@nestjs/common';
import { HabitLogsService } from './habit-logs.service';
import { HabitLogsController } from './habit-logs.controller';

@Module({
  controllers: [HabitLogsController],
  providers: [HabitLogsService],
})
export class HabitLogsModule {}
