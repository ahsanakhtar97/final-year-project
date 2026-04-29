import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { AuthInputDto } from './dto/auth-input.dto';
import { AuthResultDto } from './dto/auth-result.dto';
import { RegisterDto } from './dto/register.dto';
import { SignInDto } from './dto/sign-in.dto';

@ApiTags('auth')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  // Rate-limit login: 5 attempts per minute per IP.
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @UseGuards(AuthGuard('local'))
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Exchange email + password for a JWT.' })
  @ApiBody({ type: AuthInputDto })
  @ApiOkResponse({ type: AuthResultDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  @ApiTooManyRequestsResponse({ description: 'Too many login attempts.' })
  async login(@Request() req: { user: SignInDto }): Promise<AuthResultDto> {
    // `req.user` is populated by LocalStrategy.validate()
    return this.authService.signIn(req.user);
  }

  @Post('register')
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new account and return a JWT.' })
  @ApiOkResponse({ type: AuthResultDto })
  register(@Body() dto: RegisterDto): Promise<AuthResultDto> {
    return this.authService.register(dto);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Return the currently authenticated user (full row).' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid token.' })
  async getUserInfo(@Request() req: { user: SignInDto }) {
    // Hydrate the JWT identity from the database so professional profile
    // fields (bio, credentials, etc.) come back too. The class-serializer
    // strips the password hash automatically because of @Exclude on User.
    const fresh = await this.usersService.findOneById(req.user.userId);
    if (!fresh) return req.user;
    return {
      userId: fresh.userId,
      name: fresh.name,
      email: fresh.email,
      role: fresh.role,
      bio: fresh.bio,
      credentials: fresh.credentials,
      languages: fresh.languages,
      feeText: fresh.feeText,
      yearsExperience: fresh.yearsExperience,
    };
  }
}
