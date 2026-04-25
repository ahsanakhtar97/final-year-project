import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';

import { Task } from '../tasks/entities/task.entity';
import { TaskStatus } from '../tasks/enums/task-status.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

interface DbError {
  code?: string;
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Persist a new user. Caller is responsible for pre-hashing the password;
   * AuthService.register does that via bcrypt.
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    try {
      const entity = this.userRepository.create(createUserDto);
      return await this.userRepository.save(entity);
    } catch (err) {
      if ((err as DbError).code === '23505') {
        throw new ConflictException('User with this email already exists');
      }
      this.logger.error('Failed to create user', err as Error);
      throw new InternalServerErrorException('Could not create user');
    }
  }

  findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  findOneById(id: number): Promise<User | null> {
    return this.userRepository.findOne({
      where: { userId: id },
      relations: ['tasks'],
    });
  }

  findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async remove(userId: number): Promise<{ message: string }> {
    const result = await this.userRepository.delete({ userId });
    if (result.affected === 0) {
      throw new NotFoundException(`User with id ${userId} not found`);
    }
    return { message: 'Account deleted successfully' };
  }

  async getTasks(id: number): Promise<Task[]> {
    const user = await this.findOneById(id);
    if (!user) throw new NotFoundException('User not found');
    return user.tasks;
  }

  async getTasksByStatus(id: number, status: TaskStatus): Promise<Task[]> {
    const tasks = await this.getTasks(id);
    return tasks.filter((task) => task.taskStatus === status);
  }

  async getPercentStatus(
    id: number,
    status: TaskStatus,
  ): Promise<{ userId: number; status: TaskStatus; percentage: number }> {
    const tasks = await this.getTasks(id);
    if (tasks.length === 0) {
      return { userId: id, status, percentage: 0 };
    }
    const matching = tasks.filter((task) => task.taskStatus === status);
    return {
      userId: id,
      status,
      percentage: matching.length / tasks.length,
    };
  }

  async updateUser(
    id: number,
    updateDto: UpdateUserDto,
  ): Promise<{ accessToken: string; message: string }> {
    const user = await this.userRepository.findOne({ where: { userId: id } });
    if (!user) throw new NotFoundException('User not found');

    if (updateDto.name) user.name = updateDto.name;

    if (updateDto.email && updateDto.email !== user.email) {
      const emailExists = await this.userRepository.findOne({
        where: { email: updateDto.email },
      });
      if (emailExists && emailExists.userId !== id) {
        throw new ConflictException('Email is already registered');
      }
      user.email = updateDto.email;
    }

    if (updateDto.password) {
      if (!updateDto.confirmPassword) {
        throw new BadRequestException('Confirm password is required');
      }
      if (updateDto.password !== updateDto.confirmPassword) {
        throw new BadRequestException('Passwords do not match');
      }
      user.password = await bcrypt.hash(updateDto.password, 12);
    }

    try {
      await this.userRepository.save(user);
    } catch (err) {
      this.logger.error('Failed to update user', err as Error);
      throw new InternalServerErrorException('Failed to update user');
    }

    // Re-issue a token so the client picks up any name/email change without a
    // full logout → login cycle.
    const accessToken = await this.jwtService.signAsync({
      sub: user.userId,
      name: user.name,
      email: user.email,
    });

    return {
      accessToken,
      message: 'User updated successfully',
    };
  }
}
