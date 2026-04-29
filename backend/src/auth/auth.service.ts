import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UserRole } from '../users/enums/user-role.enum';
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

  async validateUser(input: AuthInputDto): Promise<SignInDto | null> {
    const user = await this.usersService.findOneByEmail(input.email);
    if (!user) {
      await bcrypt.compare(input.password, '$2b$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalid');
      return null;
    }
    const matches = await bcrypt.compare(input.password, user.password);
    if (!matches) return null;
    return {
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role ?? UserRole.PATIENT,
    };
  }

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
      role: user.role,
    });
    return {
      accessToken,
      userId: user.userId,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  async register(dto: RegisterDto): Promise<AuthResultDto> {
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
        role: dto.role ?? UserRole.PATIENT,
        bio: dto.bio,
        credentials: dto.credentials,
        languages: dto.languages,
        feeText: dto.feeText,
        yearsExperience: dto.yearsExperience,
      });
      this.logger.log(
        `New user registered: userId=${newUser.userId} role=${newUser.role}`,
      );
      return this.signIn({
        userId: newUser.userId,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
      });
    } catch (err) {
      const driverError = err as { code?: string };
      if (driverError?.code === '23505') {
        throw new ConflictException('An account with that email already exists');
      }
      throw err;
    }
  }
}
