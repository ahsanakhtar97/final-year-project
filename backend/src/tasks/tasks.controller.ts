import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task } from './entities/task.entity';
import { TaskStatus } from './enums/task-status.enum';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  async create(@Body() createTaskDto: CreateTaskDto):Promise<string> {
    return await this.tasksService.create(createTaskDto);
  }

  @Get()
  async findAll():Promise<Task[]> {
    return await this.tasksService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string):Promise<Task|null> {
    return await this.tasksService.findOne(+id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string):Promise<string> {
    return await this.tasksService.remove(+id);
  }
  @Get('status/:status')
  async findByStatus(@Param('status') status:TaskStatus):Promise<Task[]>{
    return await this.tasksService.findByStatus(status);
  }
}
