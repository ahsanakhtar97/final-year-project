import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { Goal } from './entities/goal.entity';
import { GoalStatus } from './enums/goal-status.enum';

@Injectable()
export class GoalsService {
  private readonly logger = new Logger(GoalsService.name);

  constructor(
    @InjectRepository(Goal)
    private readonly goalRepository: Repository<Goal>,
  ) {}

  async create(dto: CreateGoalDto): Promise<Goal> {
    const entity = this.goalRepository.create({
      userId: dto.userId,
      title: dto.title,
      description: dto.description ?? null,
      targetValue: dto.targetValue ?? 1,
      currentValue: 0,
      unit: dto.unit ?? null,
      deadline: dto.deadline ? new Date(dto.deadline) : null,
      linkedHabitId: dto.linkedHabitId ?? null,
      status: GoalStatus.ACTIVE,
    });
    return this.goalRepository.save(entity);
  }

  findByUser(userId: number): Promise<Goal[]> {
    return this.goalRepository.find({
      where: { userId },
      order: { status: 'ASC', createdAt: 'DESC' },
    });
  }

  async findOne(goalId: number): Promise<Goal> {
    const g = await this.goalRepository.findOne({ where: { goalId } });
    if (!g) throw new NotFoundException('Goal not found');
    return g;
  }

  async update(goalId: number, dto: UpdateGoalDto): Promise<Goal> {
    const g = await this.findOne(goalId);
    if (dto.title !== undefined) g.title = dto.title;
    if (dto.description !== undefined) g.description = dto.description;
    if (dto.targetValue !== undefined) g.targetValue = dto.targetValue;
    if (dto.currentValue !== undefined) g.currentValue = dto.currentValue;
    if (dto.unit !== undefined) g.unit = dto.unit;
    if (dto.deadline !== undefined)
      g.deadline = dto.deadline ? new Date(dto.deadline) : null;
    if (dto.linkedHabitId !== undefined) g.linkedHabitId = dto.linkedHabitId;
    if (dto.status !== undefined) g.status = dto.status;

    // Auto-complete when current >= target.
    if (
      g.status === GoalStatus.ACTIVE &&
      g.currentValue >= g.targetValue
    ) {
      g.status = GoalStatus.COMPLETED;
    }

    return this.goalRepository.save(g);
  }

  async increment(goalId: number, by = 1): Promise<Goal> {
    const g = await this.findOne(goalId);
    g.currentValue = Math.min(g.targetValue, g.currentValue + by);
    if (g.currentValue >= g.targetValue) g.status = GoalStatus.COMPLETED;
    return this.goalRepository.save(g);
  }

  async remove(goalId: number): Promise<{ message: string }> {
    const res = await this.goalRepository.delete(goalId);
    if (res.affected === 0) throw new NotFoundException('Goal not found');
    return { message: 'Goal deleted' };
  }
}
