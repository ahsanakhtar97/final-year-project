import { neon } from '@neondatabase/serverless';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

/**
 * neon()'s `sql` is a tagged template, but it is also callable as a plain
 * function for dynamically-built parameterized queries ($1, $2, ...).
 * That call signature isn't in the published types, so cast through this
 * instead of `any` at each call site.
 */
export type SqlQueryFn = (
  query: string,
  params: unknown[],
) => Promise<Record<string, unknown>[]>;

export function getUserIdFromRequest(req: NextRequest): number | null {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const secret = process.env.JWT_SECRET || 'fallback-secret';
    const payload = jwt.verify(token, secret) as { sub?: number | string };
    const id = Number(payload.sub);
    return isNaN(id) ? null : id;
  } catch { return null; }
}
