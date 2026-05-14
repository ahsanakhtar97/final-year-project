import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const sql = getDb();
    const rows = await sql`
      SELECT user_id, name, email, password_hash, role
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `;

    const secret = process.env.JWT_SECRET || 'fallback-secret';

    // Timing-safe: always run bcrypt compare even when user not found
    const fakeHash = '$2b$12$invalidhashfortimingprotectiononly00000000000000000000';
    const user = rows[0] ?? null;
    const hashToCompare = user ? user.password_hash : fakeHash;
    const match = await bcrypt.compare(password, hashToCompare);

    if (!user || !match) {
      return NextResponse.json({ message: 'Incorrect email or password' }, { status: 401 });
    }

    const accessToken = jwt.sign(
      { sub: user.user_id, name: user.name, email: user.email, role: user.role },
      secret,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      accessToken,
      userId: user.user_id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
