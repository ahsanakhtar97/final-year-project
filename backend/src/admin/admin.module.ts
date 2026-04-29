import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from '../users/entities/user.entity';
import { AdminController } from './admin.controller';
import { AdminGuard } from './admin.guard';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User])],
  controllers: [AdminController],
  providers: [AdminGuard],
})
export class AdminModule {}
