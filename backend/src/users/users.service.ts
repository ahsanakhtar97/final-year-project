import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import { Task } from 'src/tasks/entities/task.entity';
import { TaskStatus } from 'src/tasks/enums/task-status.enum';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtService } from '@nestjs/jwt';


@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>,private readonly jwtService:JwtService) { }
  async create(createUserDto: CreateUserDto) {
  try {
    await this.userRepository.save(createUserDto);
    return { message: 'New user created successfully' };
  } catch (error) {
    if (error.code === '23505') {
      throw new ConflictException('User with this email already exists');
    }
    throw new InternalServerErrorException('Something went wrong');
  }
}

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async findOneById(id: number): Promise<User | null> {
    return await this.userRepository.findOne({ where: { userId: id },relations:['tasks'] });
  }
  // Find A user by his email
  async findOneByEmail(email:string):Promise<User|null>{
    return await this.userRepository.findOne({where:{email}});
  }

  async remove(userId:number){
    await this.userRepository.delete({userId});
    return 'Account deleted successfully';
  }

  // Get all tasks by a user
  async getTasks(id:number):Promise<Task[]>{
    const user=await this.findOneById(id);
    if(!user) throw new NotFoundException('User not found');
    const tasks=user.tasks;
    return tasks;
  }
  async getTasksByStatus(id:number,status:TaskStatus):Promise<Task[]>{
    const tasks=await this.getTasks(id);
    const statusTasks=tasks.filter(task=>task.taskStatus==status)
    return statusTasks;
  }

  async getPercentStatus(id:number,status:TaskStatus):Promise<any>{
    const tasks=await this.getTasks(id);
    if(tasks.length===0) return 0;
    const statusTasks=tasks.filter(task=>task.taskStatus==status);
    const percentage=statusTasks.length/tasks.length;
    return {userId:id,status:status,percentage:percentage};
  }
  async updateUser(id: number, updateDto: UpdateUserDto) {
  const user = await this.userRepository.findOne({
    where: { userId: id },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  // Update name
  if (updateDto.name) {
    user.name = updateDto.name;
  }

  // Update email (only check if different)
  if (updateDto.email) {
    if (updateDto.email !== user.email) {
      const emailExists = await this.userRepository.findOne({
        where: { email: updateDto.email },
      });

      if (emailExists && emailExists.userId !== id) {
        throw new ConflictException('Email is already registered');
      }
    }

    user.email = updateDto.email;
  }

  // Update password
  if (updateDto.password) {
    if (!updateDto.confirmPassword) {
      throw new BadRequestException('Confirm password is required');
    }

    if (updateDto.password !== updateDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const hashed = await bcrypt.hash(updateDto.password, 10);
    user.passwordHash = hashed;
  }

  try {
    await this.userRepository.save(user);
    const newToken=this.jwtService.sign({
      sub:user.userId,
      name:user.name,
      email:user.email,
    });
    return{
      accessToken:newToken, 
      messaage:'User updated successfully'
    };
  } catch (error) {
    throw new InternalServerErrorException('Failed to update user');
  }
}

}
