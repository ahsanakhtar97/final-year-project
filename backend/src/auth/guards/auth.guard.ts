import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

interface JwtTokenPayload {
  sub: number;
  name: string;
  email: string;
}

/**
 * Lightweight JWT guard kept for backwards compatibility with routes that
 * haven't migrated to the passport-based `AuthGuard('jwt')` yet. Prefer
 * `@UseGuards(AuthGuard('jwt'))` from @nestjs/passport for new code.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<
      Request & { user?: JwtTokenPayload & { userId: number } }
    >();
    const authorization = request.headers.authorization;

    const token = authorization?.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtTokenPayload>(token);
      request.user = {
        ...payload,
        userId: payload.sub,
      };
      return true;
    } catch (err) {
      this.logger.debug(`JWT verification failed: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
