import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';

import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  beforeEach(async () => {
    const usersMock: Partial<jest.Mocked<UsersService>> = {
      findOneByEmail: jest.fn(),
      create: jest.fn(),
    };
    const jwtMock: Partial<jest.Mocked<JwtService>> = {
      signAsync: jest.fn().mockResolvedValue('signed.jwt.token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  describe('validateUser', () => {
    it('returns null and runs a dummy bcrypt compare when the user is unknown (timing mitigation)', async () => {
      usersService.findOneByEmail.mockResolvedValue(null);
      const compareSpy = jest.spyOn(bcrypt, 'compare');

      const result = await service.validateUser({
        email: 'ghost@example.com',
        password: 'whatever',
      });

      expect(result).toBeNull();
      expect(compareSpy).toHaveBeenCalledTimes(1);
    });

    it('returns the scrubbed user when the password matches', async () => {
      const hash = await bcrypt.hash('correct-horse', 4);
      usersService.findOneByEmail.mockResolvedValue({
        userId: 1,
        name: 'Ada',
        email: 'ada@example.com',
        password: hash,
      } as never);

      const result = await service.validateUser({
        email: 'ada@example.com',
        password: 'correct-horse',
      });

      expect(result).toEqual({
        userId: 1,
        name: 'Ada',
        email: 'ada@example.com',
      });
    });

    it('returns null when the password is wrong', async () => {
      const hash = await bcrypt.hash('correct-horse', 4);
      usersService.findOneByEmail.mockResolvedValue({
        userId: 1,
        name: 'Ada',
        email: 'ada@example.com',
        password: hash,
      } as never);

      const result = await service.validateUser({
        email: 'ada@example.com',
        password: 'wrong-password',
      });

      expect(result).toBeNull();
    });
  });

  describe('authenticate', () => {
    it('throws UnauthorizedException for bad creds', async () => {
      usersService.findOneByEmail.mockResolvedValue(null);
      await expect(
        service.authenticate({ email: 'x@y.com', password: 'nope' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('issues a JWT for valid creds', async () => {
      const hash = await bcrypt.hash('hunter2', 4);
      usersService.findOneByEmail.mockResolvedValue({
        userId: 7,
        name: 'Lin',
        email: 'lin@example.com',
        password: hash,
      } as never);

      const result = await service.authenticate({
        email: 'lin@example.com',
        password: 'hunter2',
      });

      expect(result).toEqual({
        accessToken: 'signed.jwt.token',
        userId: 7,
        name: 'Lin',
        email: 'lin@example.com',
      });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 7,
        name: 'Lin',
        email: 'lin@example.com',
      });
    });
  });

  describe('register', () => {
    it('refuses to register when the email is already in use', async () => {
      usersService.findOneByEmail.mockResolvedValue({
        userId: 1,
        email: 'taken@example.com',
      } as never);

      await expect(
        service.register({
          name: 'New',
          email: 'taken@example.com',
          password: 'secret123',
        } as never),
      ).rejects.toBeInstanceOf(ConflictException);

      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('creates the user, hashes the password, and signs a token on success', async () => {
      usersService.findOneByEmail.mockResolvedValue(null);
      usersService.create.mockImplementation(async (dto) => ({
        userId: 99,
        name: dto.name,
        email: dto.email,
        password: dto.password,
      } as never));

      const result = await service.register({
        name: 'Grace',
        email: 'grace@example.com',
        password: 'plaintext1',
      } as never);

      expect(usersService.create).toHaveBeenCalledTimes(1);
      const createArg = usersService.create.mock.calls[0][0];
      expect(createArg.password).not.toBe('plaintext1');
      expect(createArg.password.startsWith('$2')).toBe(true);

      expect(result).toEqual({
        accessToken: 'signed.jwt.token',
        userId: 99,
        name: 'Grace',
        email: 'grace@example.com',
      });
    });

    it('translates Postgres unique-violation (23505) into ConflictException', async () => {
      usersService.findOneByEmail.mockResolvedValue(null);
      usersService.create.mockRejectedValue(
        Object.assign(new Error('duplicate key'), { code: '23505' }),
      );

      await expect(
        service.register({
          name: 'Race',
          email: 'race@example.com',
          password: 'plaintext1',
        } as never),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
