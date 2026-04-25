/**
 * DEPRECATED — do not import.
 *
 * The JWT secret now lives in the environment (JWT_SECRET), validated at boot
 * by `src/common/env.validation.ts`. This file is kept only to avoid breaking
 * old tooling that referenced it and will be deleted in a future cleanup.
 *
 * If you still see imports pointing here, refactor them to read
 * `ConfigService.getOrThrow<string>('JWT_SECRET')` instead.
 */
export function getJwtSecret(): never {
  throw new Error(
    "JWT_SECRET is no longer exported from this file. Read it from ConfigService instead (ConfigService.getOrThrow('JWT_SECRET')).",
  );
}
