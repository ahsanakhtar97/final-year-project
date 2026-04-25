import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { Task } from '../tasks/entities/task.entity';
import { TaskStatus } from '../tasks/enums/task-status.enum';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'users', version: '1' })
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List every user (admin/dev only — should be locked down later).' })
  findAll(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a single user with their tasks eagerly loaded.' })
  @ApiOkResponse({ type: User })
  @ApiNotFoundResponse({ description: 'User not found.' })
  async findOneById(@Param('id', ParseIntPipe) id: number): Promise<User> {
    const user = await this.usersService.findOneById(id);
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  @Get(':id/tasks')
  @ApiOperation({ summary: "Return all of the user's tasks." })
  getTasks(@Param('id', ParseIntPipe) id: number): Promise<Task[]> {
    return this.usersService.getTasks(id);
  }

  @Get(':id/tasks/status/:status')
  @ApiOperation({ summary: 'Filter the user’s tasks by status.' })
  getTasksByStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('status') status: TaskStatus,
  ): Promise<Task[]> {
    return this.usersService.getTasksByStatus(id, status);
  }

  @Get(':id/tasks/status/:status/percentage')
  @ApiOperation({ summary: 'Compute the share of the user’s tasks in a given status.' })
  getPercentStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('status') status: TaskStatus,
  ): Promise<{ userId: number; status: TaskStatus; percentage: number }> {
    return this.usersService.getPercentStatus(id, status);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update name / email / password. Returns a refreshed JWT.' })
  updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<{ accessToken: string; message: string }> {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete the user account permanently.' })
  deleteUser(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    return this.usersService.remove(id);
  }
}
