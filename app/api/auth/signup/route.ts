import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password, role } = await req.json();

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    );
  }

  const existing = await db.orm.public.User.where({ email }).first();
  if (existing) {
    return NextResponse.json(
      { error: 'An account with this email already exists' },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);

  const user = await db.orm.public.User
    .select('id', 'email', 'role')
    .create({
      email,
      passwordHash,
      role: role ?? 'EMPLOYEE',
    });

  return NextResponse.json(user, { status: 201 });
}