import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { verifyPassword, signToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  const user = await db.orm.public.User.where({ email }).first();
  if (!user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const token = signToken({ userId: user.id, role: user.role });

  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, role: user.role },
  });
}