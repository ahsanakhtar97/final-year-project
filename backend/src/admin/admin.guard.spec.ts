import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AdminGuard } from './admin.guard';

function makeCtx(headers: Record<string, string | undefined>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ headers }),
      getResponse: () => ({}),
      getNext: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

describe('AdminGuard', () => {
  function buildGuard(adminToken: string | undefined) {
    const config = {
      get: jest.fn((key: string) =>
        key === 'ADMIN_TOKEN' ? adminToken : undefined,
      ),
    } as unknown as ConfigService;
    return new AdminGuard(config);
  }

  it('refuses every call when ADMIN_TOKEN is unset', () => {
    const guard = buildGuard(undefined);
    expect(() =>
      guard.canActivate(makeCtx({ 'x-admin-token': 'whatever' })),
    ).toThrow(UnauthorizedException);
  });

  it('refuses requests with a missing token header', () => {
    const guard = buildGuard('the-real-token');
    expect(() => guard.canActivate(makeCtx({}))).toThrow(UnauthorizedException);
  });

  it('refuses requests with the wrong token', () => {
    const guard = buildGuard('the-real-token');
    expect(() =>
      guard.canActivate(makeCtx({ 'x-admin-token': 'wrong' })),
    ).toThrow(UnauthorizedException);
  });

  it('lets matching token through', () => {
    const guard = buildGuard('the-real-token');
    expect(
      guard.canActivate(makeCtx({ 'x-admin-token': 'the-real-token' })),
    ).toBe(true);
  });
});
