import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Category } from '../categories/entities/category.entity';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { Habit } from './entities/habit.entity';

@Injectable()
export class HabitsService {
  private readonly logger = new Logger(HabitsService.name);

  constructor(
    @InjectRepository(Habit) private readonly habitRepository: Repository<Habit>,
  ) {}

  async create(createHabitDto: CreateHabitDto): Promise<Habit> {
    try {
      const entity = this.habitRepository.create(createHabitDto);
      return await this.habitRepository.save(entity);
    } catch (err) {
      this.logger.error('Failed to create habit', err as Error);
      throw new InternalServerErrorException('Could not create habit');
    }
  }

  findAll(): Promise<Habit[]> {
    return this.habitRepository.find();
  }

  async findOne(habitId: number): Promise<Habit> {
    const habit = await this.habitRepository.findOne({ where: { habitId } });
    if (!habit) throw new NotFoundException('Habit does not exist');
    return habit;
  }

  async update(habitId: number, dto: UpdateHabitDto): Promise<Habit> {
    const habit = await this.findOne(habitId);
    if (dto.habitName !== undefined) habit.habitName = dto.habitName;
    if (dto.categoryId !== undefined) habit.categoryId = dto.categoryId;
    return this.habitRepository.save(habit);
  }

  async remove(habitId: number): Promise<{ message: string }> {
    const result = await this.habitRepository.delete(habitId);
    if (result.affected === 0) {
      throw new NotFoundException('Habit does not exist');
    }
    return { message: 'Habit deleted successfully' };
  }

  async getCategory(habitId: number): Promise<Category> {
    const habit = await this.habitRepository.findOne({
      where: { habitId },
      relations: ['category'],
    });
    if (!habit) throw new NotFoundException('Habit not found');
    return habit.category;
  }
}
