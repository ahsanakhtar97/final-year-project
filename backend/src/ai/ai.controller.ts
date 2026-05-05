import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';

import { CoachRequestDto } from './dto/coach-request.dto';
import { AiService } from './ai.service';

@ApiTags('ai')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller({ path: 'ai', version: '1' })
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('coach')
  @ApiOperation({ summary: 'Personalized coaching reply built from the user-supplied context snapshot.' })
  coach(
    @Body() dto: CoachRequestDto,
  ): Promise<{ reply: string; suggestions: string[]; tone: 'encourage' | 'celebrate' | 'reset' }> {
    return this.aiService.coach(dto);
  }

  @Post('analyze-mood')
  @ApiOperation({ summary: 'Detect mood score and emotion tags from a free-text description.' })
  analyzeMood(
    @Body('text') text: string,
  ): Promise<{ score: number; tags: string[]; reflection: string }> {
    return this.aiService.analyzeMoodText(text);
  }

  @Post('parse-task')
  @ApiOperation({ summary: 'Parse a natural-language task description into structured task fields.' })
  parseTask(
    @Body('description') description: string,
  ): Promise<{ title: string; description: string; priority: string; dueDate: string | null }> {
    return this.aiService.parseTaskDescription(description);
  }

  @Post('journal-prompt')
  @ApiOperation({ summary: 'Generate a personalised journal prompt based on recent mood.' })
  journalPrompt(
    @Body() body: { recentMoodAvg?: number; recentTags?: string[] },
  ): Promise<{ prompt: string }> {
    return this.aiService.generateJournalPrompt(body.recentMoodAvg, body.recentTags);
  }
}
