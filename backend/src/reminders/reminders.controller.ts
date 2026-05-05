import {
  Body, Controller, Delete, Get, Param,
  ParseIntPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RemindersService } from './reminders.service';
import { CreateReminderDto } from './dto/create-reminder.dto';

@ApiTags('reminders')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'reminders', version: '1' })
export class RemindersController {
  constructor(private readonly svc: RemindersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a reminder.' })
  create(@Body() dto: CreateReminderDto) {
    return this.svc.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reminders for a user.' })
  findAll(@Query('userId', ParseIntPipe) userId: number) {
    return this.svc.findByUser(userId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread reminder count.' })
  unreadCount(@Query('userId', ParseIntPipe) userId: number) {
    return this.svc.unreadCount(userId);
  }

  @Get('smart')
  @ApiOperation({ summary: 'Get auto-generated smart reminders (not stored).' })
  smart(@Query('userId', ParseIntPipe) userId: number) {
    return this.svc.getSmartReminders(userId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a reminder as read.' })
  markRead(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.svc.markRead(id, userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Mark all reminders as read.' })
  markAllRead(@Query('userId', ParseIntPipe) userId: number) {
    return this.svc.markAllRead(userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a reminder.' })
  remove(
    @Param('id', ParseIntPipe) id: number,
    @Query('userId', ParseIntPipe) userId: number,
  ) {
    return this.svc.remove(id, userId);
  }
}
