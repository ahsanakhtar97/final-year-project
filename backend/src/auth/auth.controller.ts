import { Controller, Post, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Login route
  @UseGuards(AuthGuard('local'))
  @Post('login')
  async login(@Request() req) {
    // req.user comes from LocalStrategy.validate()
    return this.authService.signIn(req.user);
  }

  // Protected route
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getUserInfo(@Request() req) {
    return req.user;
  }
}
