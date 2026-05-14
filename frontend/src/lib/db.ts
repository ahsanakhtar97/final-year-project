import { neon } from '@neondatabase/serverless';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  return neon(url);
}

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
