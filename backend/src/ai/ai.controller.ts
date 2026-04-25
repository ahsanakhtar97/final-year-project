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
  @ApiOperation({
    summary:
      'Personalized coaching reply built from the user-supplied context snapshot.',
  })
  coach(
    @Body() dto: CoachRequestDto,
  ): { reply: string; suggestions: string[]; tone: 'encourage' | 'celebrate' | 'reset' } {
    return this.aiService.coach(dto);
  }
}
