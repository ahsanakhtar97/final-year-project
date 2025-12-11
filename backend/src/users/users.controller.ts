import { Controller, Get, Post, Body, Patch, Param, Delete, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { Task } from 'src/tasks/entities/task.entity';
import { TaskStatus } from 'src/tasks/enums/task-status.enum';
import { UpdateUserDto } from './dto/update-user.dto';
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    return await this.usersService.create(createUserDto);
  }

  @Get()
  async findAll() {
    return await this.usersService.findAll();
  }

  @Get(':id')
  async findOneById(@Param('id') id: string):Promise<User|null> {
    const user=await this.usersService.findOneById(+id);
    if(!user) throw new NotFoundException(`User with id ${id} not found`)
      return user;
  }
  @Get(':id/tasks')
  async getTasks(@Param('id') id:number):Promise<Task[]>{
    return await this.usersService.getTasks(+id);
  }
  @Get(':id/tasks/status/:status')
  async getTasksByStatus(@Param('id') id:number,@Param('status') status:TaskStatus):Promise<Task[]>{
    return await this.usersService.getTasksByStatus(+id,status);
  }
  @Get(':id/tasks/status/:status/percentage')
  async getPercentStatus(@Param('id') id:number,@Param('status') status:TaskStatus):Promise<any>{
    return await this.usersService.getPercentStatus(+id,status);

  }
  @Patch(':id')
  async updateUser(@Param('id') userId:number,@Body() updateUserDto:UpdateUserDto){
    return await this.usersService.updateUser(userId,updateUserDto);
  }
  @Delete(':id')
async deleteUser(@Param('id') id: number) {
  return await this.usersService.remove(id);
}

}
