import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Habit } from './entities/habit.entity';
import { Repository } from 'typeorm';
import { NotFoundError } from 'rxjs';
import { Category } from 'src/categories/entities/category.entity';

@Injectable()
export class HabitsService {
  constructor(@InjectRepository(Habit) private readonly habitRepository:Repository<Habit>){}
  async create(createHabitDto: CreateHabitDto):Promise<string> {
    await this.habitRepository.save(createHabitDto);
    return 'New habit created successfully';
  }

  async findAll():Promise<Habit[]> {
    return await this.habitRepository.find();
  }

  async findOne(habitId: number):Promise<Habit|null> {
    const habit=await this.habitRepository.findOne({where:{habitId}});
    return habit;
  }

  update(id: number, updateHabitDto: UpdateHabitDto) {
    return `This action updates a #${id} habit`;
  }

  async remove(habitId: number):Promise<string> {
    const habit=await this.findOne(habitId);
    if(!habit) throw new NotFoundException('Habit does not exist');
    await this.habitRepository.delete(habitId);
    return 'Habit deleted successfully';
  }
  async getcategory(habitId:number):Promise<Category>{
    const habit=await this.habitRepository.findOne({where:{habitId},relations:['categories']});
    if(!habit) throw new NotFoundException('Habit not found');
    const category=habit.category;
    return category;
  }

}
