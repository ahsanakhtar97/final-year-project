import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from '../appointments/entities/appointment.entity';
import { User } from '../users/entities/user.entity';
import { RolesGuard } from '../auth/roles.guard';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, Appointment]),
  ],
  controllers: [AdminController],
  providers: [RolesGuard],
})
export class AdminModule {}
