import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

import { CreateGoalDto } from './create-goal.dto';
import { GoalStatus } from '../enums/goal-status.enum';

export class UpdateGoalDto extends PartialType(CreateGoalDto) {
  @IsOptional()
  @IsEnum(GoalStatus)
  status?: GoalStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  currentValue?: number;
}
