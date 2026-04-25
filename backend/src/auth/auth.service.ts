import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';
import { AuthInputDto } from './dto/auth-input.dto';
import { AuthResultDto } from './dto/auth-result.dto';
import { RegisterDto } from './dto/register.dto';
import { SignInDto } from './dto/sign-in.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private static readonly BCRYPT_ROUNDS = 12;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Called by LocalStrategy — verifies email + password and returns a
   * scrubbed user representation (no password hash).
   */
  async validateUser(input: AuthInputDto): Promise<SignInDto | null> {
    const user = await this.usersService.findOneByEmail(input.email);
    if (!user) {
      // Run a dummy bcrypt compare so the response time doesn't leak
      // whether the email exists (basic timing-attack mitigation).
      await bcrypt.compare(input.password, '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid');
      return null;
    }

    const matches = await bcrypt.compare(input.password, user.password);
    if (!matches) return null;

    return {
      userId: user.userId,
      name: user.name,
      email: user.email,
    };
  }

  /** Convenience wrapper for callers that don't go through passport. */
  async authenticate(input: AuthInputDto): Promise<AuthResultDto> {
    const user = await this.validateUser(input);
    if (!user) throw new UnauthorizedException('Incorrect email or password');
    return this.signIn(user);
  }

  async signIn(user: SignInDto): Promise<AuthResultDto> {
    const accessToken = await this.jwtService.signAsync({
      sub: user.userId,
      name: user.name,
      email: user.email,
    });
    return {
      accessToken,
      userId: user.userId,
      name: user.name,
      email: user.email,
    };
  }

  async register(dto: RegisterDto): Promise<AuthResultDto> {
    // NB: findOneByEmail + create is not atomic — the Users table should
    // additionally have a UNIQUE constraint on email so Postgres rejects a
    // duplicate that wins the race. We catch that error below just in case.
    const existing = await this.usersService.findOneByEmail(dto.email);
    if (existing) {
      throw new ConflictException('An account with that email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, AuthService.BCRYPT_ROUNDS);
    try {
      const newUser = await this.usersService.create({
        name: dto.name,
        email: dto.email,
        password: passwordHash,
      });
      this.logger.log(`New user registered: userId=${newUser.userId}`);
      return this.signIn({
        userId: newUser.userId,
        name: newUser.name,
        email: newUser.email,
      });
    } catch (err) {
      // Handle the Postgres unique-violation fallback.
      const driverError = err as { code?: string; detail?: string };
      if (driverError?.code === '23505') {
        throw new ConflictException('An account with that email already exists');
      }
      throw err;
    }
  }
}
