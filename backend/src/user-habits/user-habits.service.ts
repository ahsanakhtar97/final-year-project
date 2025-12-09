import { Injectable } from '@nestjs/common';
import { CreateUserHabitDto } from './dto/create-user-habit.dto';
import { UpdateUserHabitDto } from './dto/update-user-habit.dto';
import { UserHabit } from './entities/user-habit.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserHabitsService {
  constructor(@InjectRepository(UserHabit) private readonly userHabitRepository:Repository<UserHabit>){}
  async assignHabit(createUserHabitDto: CreateUserHabitDto):Promise<string> {
    await this.userHabitRepository.save({...createUserHabitDto,startDate:new Date()});
    return 'New habit assigned successfully!';
  }
  async findUserHabit(userId:number,habitId:number):Promise<UserHabit|null>{
    const userHabit=await this.userHabitRepository.findOne({where:{userId,habitId}});
    return userHabit;
  }

  async findAll():Promise<UserHabit[]> {
    return await this.userHabitRepository.find();
  }

  findOne(id: number) {
    return `This action returns a #${id} userHabit`;
  }

  update(id: number, updateUserHabitDto: UpdateUserHabitDto) {
    return `This action updates a #${id} userHabit`;
  }

  remove(id: number) {
    return `This action removes a #${id} userHabit`;
  }
}
