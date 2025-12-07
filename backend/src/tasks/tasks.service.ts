import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Task } from './entities/task.entity';
import { Repository } from 'typeorm';
import { TaskStatus } from './enums/task-status.enum';

@Injectable()
export class TasksService {
  constructor(@InjectRepository(Task) private readonly tasksRepository:Repository<Task>){}
  async create(createTaskDto: CreateTaskDto):Promise<string> {
    const task=await this.tasksRepository.save(createTaskDto);
    return 'Task created successfully';

  }

  async findAll():Promise<Task[]> {
    return await this.tasksRepository.find();
  }

  async findOne(id: number):Promise<Task|null> {
    return await this.tasksRepository.findOne({where:{taskId:id}});
  }
  async remove(id: number):Promise<string> {
    const exists=await this.findOne(id);
    if(exists===null) throw new NotFoundException('Task does not exist');
    await this.tasksRepository.delete(id);
    return 'Task deleted successfully';

  }
  async findByStatus(status:TaskStatus):Promise<Task[]>{
    const tasks=await this.tasksRepository.find({where:{taskStatus:status}});
    return tasks;
  }

}
