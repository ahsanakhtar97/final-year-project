import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

interface AuthedUser {
  userId: number;
  role?: string;
}

/**
 * Must be applied *after* AuthGuard('jwt') so req.user is already populated.
 * Usage: @UseGuards(AuthGuard('jwt'), RolesGuard)  +  @Roles('admin')
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const req = context.switchToHttp().getRequest<{ user?: AuthedUser }>();
    const userRole = req.user?.role ?? '';

    if (!required.includes(userRole)) {
      throw new ForbiddenException('You do not have permission to access this resource.');
    }
    return true;
  }
}
