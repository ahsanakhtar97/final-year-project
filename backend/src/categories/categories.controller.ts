import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';
import { Habit } from 'src/habits/entities/habit.entity';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto):Promise<string> {
    return await this.categoriesService.create(createCategoryDto);
  }

  @Get()
  async findAll():Promise<Category[]> {
    return await this.categoriesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') categoryId: number):Promise<Category|null> {
    return await this.categoriesService.findOne(+categoryId);
  }

  @Patch(':id/:name/:newName')
  async update(@Param('id') categoryId: number, @Body('newName') newName:string ):Promise<string> {
    return await this.categoriesService.update(+categoryId, newName);
  }

  @Delete(':id')
  async remove(@Param('id') categoryId: number):Promise<string> {
    return await this.categoriesService.remove(+categoryId);
  }
  @Get(':id/habits')
  async getHabits(@Param('id') categoryId:number):Promise<Habit[]>{
    return await this.categoriesService.getHabits(categoryId);
  }
}
