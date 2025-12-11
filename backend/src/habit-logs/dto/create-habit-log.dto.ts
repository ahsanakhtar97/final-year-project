import { HabitStatus } from "../enums/habit-status.enum";

export class CreateHabitLogDto {
  userHabitId: number;
  date: Date;
  status: HabitStatus;
}
