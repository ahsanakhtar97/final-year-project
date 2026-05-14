import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getDb } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const {
      name,
      email,
      password,
      role,
      bio,
      credentials,
      languages,
      feeText,
      yearsExperience,
    } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Name, email, and password are required' }, { status: 400 });
    }

    const sql = getDb();

    // Check for existing email
    const existing = await sql`
      SELECT user_id FROM users WHERE email = ${email} LIMIT 1
    `;
    if (existing.length > 0) {
      return NextResponse.json({ message: 'Email already in use' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const inserted = await sql`
      INSERT INTO users (name, email, password_hash, role, bio, credentials, languages, fee_text, years_experience)
      VALUES (
        ${name},
        ${email},
        ${password_hash},
        ${role ?? 'patient'},
        ${bio ?? null},
        ${credentials ?? null},
        ${languages ?? null},
        ${feeText ?? null},
        ${yearsExperience ?? null}
      )
      RETURNING user_id, name, email, role
    `;

    const user = inserted[0];
    const secret = process.env.JWT_SECRET || 'fallback-secret';

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
    }, { status: 201 });
  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
