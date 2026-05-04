import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MoodLog } from './entities/mood-log.entity';
import { MoodController } from './mood.controller';
import { MoodService } from './mood.service';

@Module({
  imports: [TypeOrmModule.forFeature([MoodLog])],
  controllers: [MoodController],
  providers: [MoodService],
  exports: [MoodService],
})
export class MoodModule {}
