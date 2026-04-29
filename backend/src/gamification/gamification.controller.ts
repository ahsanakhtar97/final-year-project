import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('gamification')
@UseGuards(AuthGuard('jwt'))
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('badges')
  async getBadges() {
    return this.gamificationService.getBadges();
  }

  @Get('user/:id/badges')
  async getUserBadges(@Param('id') id: string) {
    return this.gamificationService.getUserBadges(+id);
  }
}
