import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateHabitLogDto } from './dto/create-habit-log.dto';
import { UpdateHabitLogDto } from './dto/update-habit-log.dto';
import { HabitLog } from './entities/habit-log.entity';
import { HabitStatus } from './enums/habit-status.enum';

@Injectable()
export class HabitLogsService {
  private readonly logger = new Logger(HabitLogsService.name);

  constructor(
    @InjectRepository(HabitLog)
    private readonly habitLogsRepository: Repository<HabitLog>,
  ) {}

  async create(dto: CreateHabitLogDto): Promise<HabitLog> {
    try {
      const newLog = this.habitLogsRepository.create({
        userHabit: { userHabitId: dto.userHabitId },
        date: dto.date,
        status: dto.status ?? HabitStatus.COMPLETED,
        moodScore: dto.moodScore ?? 5,
      });
      return await this.habitLogsRepository.save(newLog);
    } catch (err) {
      this.logger.error('Failed to create habit log', err as Error);
      throw new InternalServerErrorException('Could not create habit log');
    }
  }

  findAll(): Promise<HabitLog[]> {
    return this.habitLogsRepository.find({ order: { logId: 'DESC' } });
  }

  async findOne(logId: number): Promise<HabitLog> {
    const log = await this.habitLogsRepository.findOne({ where: { logId } });
    if (!log) {
      throw new NotFoundException(`HabitLog with ID ${logId} not found`);
    }
    return log;
  }

  async update(id: number, dto: UpdateHabitLogDto): Promise<HabitLog> {
    const log = await this.findOne(id);
    if (dto.date !== undefined) log.date = dto.date;
    if (dto.status !== undefined) log.status = dto.status;
    if (dto.moodScore !== undefined) log.moodScore = dto.moodScore;
    return this.habitLogsRepository.save(log);
  }

  async remove(logId: number): Promise<{ message: string }> {
    const result = await this.habitLogsRepository.delete(logId);
    if (result.affected === 0) {
      throw new NotFoundException(`HabitLog with ID ${logId} not found`);
    }
    return { message: `HabitLog #${logId} removed successfully` };
  }

  /**
   * Find every log that belongs to a specific user, by joining through the
   * UserHabit relation.
   */
  findByUserId(userId: number): Promise<HabitLog[]> {
    return this.habitLogsRepository.find({
      relations: ['userHabit'],
      where: { userHabit: { userId } },
      order: { logId: 'DESC' },
    });
  }
}
