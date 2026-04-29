import { Controller, Get, Post, Patch, Param, UseGuards, Req, Body } from '@nestjs/common';
import { BuddiesService } from './buddies.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('buddies')
@UseGuards(AuthGuard('jwt'))
export class BuddiesController {
  constructor(private readonly buddiesService: BuddiesService) {}

  @Get('user/:id')
  async getUserBuddies(@Param('id') userId: string) {
    return this.buddiesService.getUserBuddies(+userId);
  }

  @Post('request')
  async sendRequest(@Req() req, @Body('receiverId') receiverId: number) {
    return this.buddiesService.sendRequest(req.user.userId, receiverId);
  }

  @Patch('accept/:id')
  async acceptRequest(@Param('id') connectionId: string) {
    return this.buddiesService.acceptRequest(+connectionId);
  }
}
