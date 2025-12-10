import { Injectable } from '@nestjs/common';
import { CreateHabitLogDto } from './dto/create-habit-log.dto';
import { UpdateHabitLogDto } from './dto/update-habit-log.dto';

@Injectable()
export class HabitLogsService {
  create(createHabitLogDto: CreateHabitLogDto) {
    return 'This action adds a new habitLog';
  }

  findAll() {
    return `This action returns all habitLogs`;
  }

  findOne(id: number) {
    return `This action returns a #${id} habitLog`;
  }

  update(id: number, updateHabitLogDto: UpdateHabitLogDto) {
    return `This action updates a #${id} habitLog`;
  }

  remove(id: number) {
    return `This action removes a #${id} habitLog`;
  }
}
