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
import { GamificationService } from '../gamification/gamification.service';
import { UserHabit } from '../user-habits/entities/user-habit.entity';

@Injectable()
export class HabitLogsService {
  private readonly logger = new Logger(HabitLogsService.name);

  constructor(
    @InjectRepository(HabitLog)
    private readonly habitLogsRepository: Repository<HabitLog>,
    @InjectRepository(UserHabit)
    private readonly userHabitsRepository: Repository<UserHabit>,
    private readonly gamificationService: GamificationService,
  ) {}

  async create(dto: CreateHabitLogDto): Promise<HabitLog> {
    try {
      const newLog = this.habitLogsRepository.create({
        userHabit: { userHabitId: dto.userHabitId },
        date: dto.date,
        status: dto.status ?? HabitStatus.COMPLETED,
        moodScore: dto.moodScore ?? 5,
      });
      const savedLog = await this.habitLogsRepository.save(newLog);

      if (savedLog.status === HabitStatus.COMPLETED) {
        const userHabit = await this.userHabitsRepository.findOne({ where: { userHabitId: dto.userHabitId }});
        if (userHabit) {
          await this.gamificationService.awardXp(userHabit.userId, 5); // 5 XP for habit
        }
      }

      return savedLog;
    } catch (err) {
      this.logger.error('Failed to create habit log', err as Error);
      throw new InternalServerErrorException('Could not create habit log');
    }
  }

  findAll(): Promise<HabitLog[]> {
    return this.habitLogsRepository.find({ order: { logId: 'DESC' } });
  }

  async findOne(logId: number): Promise<HabitLog> {
    const log = await this.habitLogsRepository.findOne({ 
      where: { logId },
      relations: ['userHabit']
    });
    if (!log) {
      throw new NotFoundException(`HabitLog with ID ${logId} not found`);
    }
    return log;
  }

  async update(id: number, dto: UpdateHabitLogDto): Promise<HabitLog> {
    const log = await this.findOne(id);
    const oldStatus = log.status;
    
    if (dto.date !== undefined) log.date = dto.date;
    if (dto.status !== undefined) log.status = dto.status;
    if (dto.moodScore !== undefined) log.moodScore = dto.moodScore;
    
    const savedLog = await this.habitLogsRepository.save(log);

    if (oldStatus !== HabitStatus.COMPLETED && savedLog.status === HabitStatus.COMPLETED) {
      const userHabit = await this.userHabitsRepository.findOne({ where: { userHabitId: savedLog.userHabit.userHabitId }});
      if (userHabit) {
        await this.gamificationService.awardXp(userHabit.userId, 5);
      }
    }

    return savedLog;
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
