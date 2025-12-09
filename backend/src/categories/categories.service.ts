import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Category } from './entities/category.entity';
import { Repository } from 'typeorm';
import { Habit } from 'src/habits/entities/habit.entity';

@Injectable()
export class CategoriesService {
  constructor(@InjectRepository(Category) private readonly categoryRepository:Repository<Category> ){}


  async create(createCategoryDto: CreateCategoryDto):Promise<string> {
    await this.categoryRepository.save(createCategoryDto);
    return 'Category created successfully';
  }

  async findAll():Promise<Category[]> {
    const categories=await this.categoryRepository.find();
    return categories;
  }

  async findOne(categoryId: number):Promise<Category|null> {
    const category=await this.categoryRepository.findOne({where:{categoryId}});
    return category;
  }

  async update(categoryId: number, newName):Promise<string> {
    const category=await this.findOne(categoryId);
    if(!category) throw new NotFoundException('Category does not exist');
    category.categoryName=newName;
    await this.categoryRepository.save(category);
    return 'category updated successfully';
  }

  async remove(categoryId: number):Promise<string> {
    const category=await this.findOne(categoryId);
    if(!category) throw new NotFoundException('Category does not exist');
    await this.categoryRepository.delete(categoryId);
    throw 'Category deleted successfully';
  }
  async getHabits(categoryId:number):Promise<Habit[]>{
    const category=await this.categoryRepository.findOne({where:{categoryId},relations:['habits']});
    if(!category) throw new NotFoundException('Category does not exist');
    const habits=category.habits;
    return habits;
  }
}
