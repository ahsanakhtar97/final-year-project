import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './users/users.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { JwtModule } from '@nestjs/jwt';
import { JWT_SECRET } from './configs/jwt-secret';
import { TasksModule } from './tasks/tasks.module';
import { CategoriesModule } from './categories/categories.module';
import { HabitsModule } from './habits/habits.module';
import { UserHabitsModule } from './user-habits/user-habits.module';

@Module({
  imports: [ConfigModule.forRoot({isGlobal:true}), DatabaseModule, UsersModule, AuthModule, TasksModule, CategoriesModule, HabitsModule, UserHabitsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
