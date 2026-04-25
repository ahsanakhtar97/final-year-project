import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { IsInt, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

import { AiService } from './ai/ai.service';
import { HabitLogsService } from './habit-logs/habit-logs.service';
import { UserHabitsService } from './user-habits/user-habits.service';

class AnalyzeJournalDto {
  @ApiProperty({ example: 42 })
  @IsInt()
  @IsPositive()
  userId!: number;

  @ApiProperty({ example: 'Today I felt productive and centered.' })
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  text!: string;
}

@ApiTags('dashboard')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(
    private readonly aiService: AiService,
    private readonly userHabitsService: UserHabitsService,
    private readonly habitLogsService: HabitLogsService,
  ) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Aggregate dashboard tile: mood, habit count, AI recommendation.',
  })
  async getDashboardSummary(): Promise<{
    mood: number;
    habitsCount: number;
    recommendation: string;
  }> {
    const selectedHabits = await this.userHabitsService.findAll();
    const habitsCount = selectedHabits.length;

    const allLogs = await this.habitLogsService.findAll();
    const latestLog = allLogs[0];
    const currentMoodScore = latestLog ? latestLog.moodScore : 5;

    const recommendation = await this.aiService.getRecommendation(
      currentMoodScore,
      habitsCount,
    );

    return { mood: currentMoodScore, habitsCount, recommendation };
  }

  @Post('analyze-journal')
  @ApiOperation({ summary: 'Run sentiment analysis on a journal entry.' })
  async analyzeJournal(@Body() dto: AnalyzeJournalDto): Promise<{
    feedbackEnglish: string;
    feedbackUrdu: string;
    score: number;
  }> {
    const analysis = await this.aiService.analyzeSentiment(dto.text);
    return {
      feedbackEnglish: analysis.englishMessage,
      feedbackUrdu: analysis.urduMessage,
      score: analysis.score,
    };
  }
}
