import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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

import { Habit } from '../habits/entities/habit.entity';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@ApiTags('categories')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'categories', version: '1' })
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new habit category.' })
  create(@Body() createCategoryDto: CreateCategoryDto): Promise<Category> {
    return this.categoriesService.create(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'List all habit categories.' })
  findAll(): Promise<Category[]> {
    return this.categoriesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a single category.' })
  findOne(@Param('id', ParseIntPipe) categoryId: number): Promise<Category> {
    return this.categoriesService.findOne(categoryId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a category.' })
  update(
    @Param('id', ParseIntPipe) categoryId: number,
    @Body() dto: UpdateCategoryDto,
  ): Promise<Category> {
    return this.categoriesService.update(categoryId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category.' })
  remove(@Param('id', ParseIntPipe) categoryId: number): Promise<{ message: string }> {
    return this.categoriesService.remove(categoryId);
  }

  @Get(':id/habits')
  @ApiOperation({ summary: 'List every habit that belongs to this category.' })
  getHabits(@Param('id', ParseIntPipe) categoryId: number): Promise<Habit[]> {
    return this.categoriesService.getHabits(categoryId);
  }
}
