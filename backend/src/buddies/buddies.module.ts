import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BuddiesService } from './buddies.service';
import { BuddiesController } from './buddies.controller';
import { BuddyConnection } from './entities/buddy-connection.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BuddyConnection, User])],
  controllers: [BuddiesController],
  providers: [BuddiesService],
})
export class BuddiesModule {}
