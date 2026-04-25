import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CreateTaskDto } from './dto/create-task.dto';
import { Task } from './entities/task.entity';
import { TaskStatus } from './enums/task-status.enum';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'tasks', version: '1' })
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task for a user.' })
  create(@Body() createTaskDto: CreateTaskDto): Promise<Task> {
    return this.tasksService.create(createTaskDto);
  }

  @Get()
  @ApiOperation({ summary: 'List every task in the system.' })
  findAll(): Promise<Task[]> {
    return this.tasksService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a single task by id.' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Task> {
    return this.tasksService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a task by id.' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.tasksService.remove(id);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Find every task in a given status.' })
  findByStatus(
    @Param('status', new ParseEnumPipe(TaskStatus)) status: TaskStatus,
  ): Promise<Task[]> {
    return this.tasksService.findByStatus(status);
  }

  @Patch(':id/status/:newStatus')
  @ApiOperation({ summary: 'Move a task to a new status.' })
  updateStatus(
    @Param('id', ParseIntPipe) taskId: number,
    @Param('newStatus', new ParseEnumPipe(TaskStatus)) newStatus: TaskStatus,
  ): Promise<Task> {
    return this.tasksService.updateStatus(taskId, newStatus);
  }
}
