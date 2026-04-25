import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Habit } from '../habits/entities/habit.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

interface DbError {
  code?: string;
}

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    try {
      const entity = this.categoryRepository.create(createCategoryDto);
      return await this.categoryRepository.save(entity);
    } catch (err) {
      if ((err as DbError).code === '23505') {
        throw new ConflictException('Category with this name already exists');
      }
      this.logger.error('Failed to create category', err as Error);
      throw new InternalServerErrorException('Could not create category');
    }
  }

  findAll(): Promise<Category[]> {
    return this.categoryRepository.find();
  }

  async findOne(categoryId: number): Promise<Category> {
    const category = await this.categoryRepository.findOne({ where: { categoryId } });
    if (!category) throw new NotFoundException('Category does not exist');
    return category;
  }

  async update(categoryId: number, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(categoryId);
    if (dto.categoryName !== undefined) {
      category.categoryName = dto.categoryName;
    }
    return this.categoryRepository.save(category);
  }

  async remove(categoryId: number): Promise<{ message: string }> {
    const result = await this.categoryRepository.delete(categoryId);
    if (result.affected === 0) {
      throw new NotFoundException('Category does not exist');
    }
    return { message: 'Category deleted successfully' };
  }

  async getHabits(categoryId: number): Promise<Habit[]> {
    const category = await this.categoryRepository.findOne({
      where: { categoryId },
      relations: ['habits'],
    });
    if (!category) throw new NotFoundException('Category does not exist');
    return category.habits;
  }
}
