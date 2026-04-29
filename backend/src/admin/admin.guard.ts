import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';

/**
 * Header-token gate for admin endpoints.
 *
 * The request must include `x-admin-token: <ADMIN_TOKEN>` matching the value
 * in the backend's .env. If ADMIN_TOKEN is unset, every admin call is
 * rejected -- so an empty deployment can't be exploited.
 *
 * This is intentionally simple: a real admin role + UI is overkill while the
 * only admin operation is "flip a verified flag a handful of times." The
 * guard makes the operation safe to expose over the API without standing up
 * a separate admin app.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const expected = this.config.get<string>('ADMIN_TOKEN');
    if (!expected) {
      throw new UnauthorizedException(
        'Admin endpoints are disabled. Set ADMIN_TOKEN in backend/.env to enable them.',
      );
    }
    const req = context.switchToHttp().getRequest<Request>();
    const provided =
      (req.headers['x-admin-token'] as string | undefined) ?? undefined;
    if (!provided || provided !== expected) {
      throw new UnauthorizedException('Invalid or missing x-admin-token header.');
    }
    return true;
  }
}
