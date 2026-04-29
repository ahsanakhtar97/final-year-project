import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GamificationService } from '../gamification/gamification.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { Task } from './entities/task.entity';
import { TaskStatus } from './enums/task-status.enum';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(Task) private readonly tasksRepository: Repository<Task>,
    private readonly gamificationService: GamificationService,
  ) {}

  async create(createTaskDto: CreateTaskDto): Promise<Task> {
    try {
      const entity = this.tasksRepository.create(createTaskDto);
      return await this.tasksRepository.save(entity);
    } catch (err) {
      this.logger.error('Failed to create task', err as Error);
      throw new InternalServerErrorException('Could not create task');
    }
  }

  findAll(): Promise<Task[]> {
    return this.tasksRepository.find();
  }

  async findOne(id: number): Promise<Task> {
    const task = await this.tasksRepository.findOne({ where: { taskId: id } });
    if (!task) throw new NotFoundException('Task does not exist');
    return task;
  }

  async remove(id: number): Promise<{ message: string }> {
    const result = await this.tasksRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('Task does not exist');
    }
    return { message: 'Task deleted successfully' };
  }

  findByStatus(status: TaskStatus): Promise<Task[]> {
    return this.tasksRepository.find({ where: { taskStatus: status } });
  }

  async updateStatus(taskId: number, newStatus: TaskStatus): Promise<Task> {
    const task = await this.findOne(taskId);
    const oldStatus = task.taskStatus;
    task.taskStatus = newStatus;
    if (newStatus === TaskStatus.COMPLETED) {
      task.completedAt = new Date();
    }
    const savedTask = await this.tasksRepository.save(task);

    // Award XP if task is completed
    if (oldStatus !== TaskStatus.COMPLETED && newStatus === TaskStatus.COMPLETED) {
      await this.gamificationService.awardXp(savedTask.userId, 10); // 10 XP per task
    }

    return savedTask;
  }

  async addFocusMinutes(taskId: number, minutes: number): Promise<Task> {
    const task = await this.findOne(taskId);
    task.focusMinutes = (task.focusMinutes || 0) + minutes;
    return this.tasksRepository.save(task);
  }
}
