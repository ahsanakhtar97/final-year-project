import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { Goal } from './entities/goal.entity';
import { GoalsService } from './goals.service';

@ApiTags('goals')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'goals', version: '1' })
export class GoalsController {
  constructor(private readonly goalsService: GoalsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a goal.' })
  create(@Body() dto: CreateGoalDto): Promise<Goal> {
    return this.goalsService.create(dto);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'List a user\u2019s goals.' })
  byUser(@Param('userId', ParseIntPipe) userId: number): Promise<Goal[]> {
    return this.goalsService.findByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a single goal.' })
  one(@Param('id', ParseIntPipe) id: number): Promise<Goal> {
    return this.goalsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a goal.' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateGoalDto,
  ): Promise<Goal> {
    return this.goalsService.update(id, dto);
  }

  @Patch(':id/increment')
  @ApiOperation({ summary: 'Increment goal progress by 1.' })
  increment(@Param('id', ParseIntPipe) id: number): Promise<Goal> {
    return this.goalsService.increment(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a goal.' })
  remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    return this.goalsService.remove(id);
  }
}
