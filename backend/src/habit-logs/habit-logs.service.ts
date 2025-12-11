import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateHabitLogDto } from './dto/create-habit-log.dto';
import { UpdateHabitLogDto } from './dto/update-habit-log.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { HabitLog } from './entities/habit-log.entity';
import { Repository, Between } from 'typeorm';
import { HabitStatus } from './enums/habit-status.enum';
import { UserHabit } from 'src/user-habits/entities/user-habit.entity';

@Injectable()
export class HabitLogsService {
  constructor(
    @InjectRepository(HabitLog)
    private readonly habitLogsRepository: Repository<HabitLog>,
  ) {}

  async create(createHabitLogDto: CreateHabitLogDto): Promise<HabitLog> {
    const habitLog = this.habitLogsRepository.create(createHabitLogDto);
    return await this.habitLogsRepository.save(habitLog);
  }

  async findAll(): Promise<HabitLog[]> {
    return await this.habitLogsRepository.find();
  }

  async findOne(logId: number): Promise<HabitLog> {
    const log = await this.habitLogsRepository.findOne({where:{logId}});

    if (!log) {
      throw new NotFoundException(`HabitLog with ID ${logId} not found`);
    }

    return log;
  }

  async update(
    id: number,
    updateHabitLogDto: UpdateHabitLogDto,
  ): Promise<HabitLog> {
    const log = await this.findOne(id);

    const updated = Object.assign(log, updateHabitLogDto);
    return await this.habitLogsRepository.save(updated);
  }


  async remove(logId: number): Promise<{ message: string }> {
    const log = await this.findOne(logId);

    await this.habitLogsRepository.remove(log);

    return { message: `HabitLog #${logId} removed successfully` };
  }
}
