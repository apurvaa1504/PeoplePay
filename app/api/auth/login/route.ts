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

  let employeeId: string | null = null;
  try {
    // 1. Direct link by userId
    let emp: any = await db.orm.public.Employee.where({ userId: user.id }).first();

    // 2. If not linked by userId yet, try matching by user's email prefix or name
    if (!emp) {
      const emailPrefix = user.email.split('@')[0].toLowerCase();
      const allEmps = await db.orm.public.Employee.all();
      emp = allEmps.find(
        (e: any) =>
          e.firstName?.toLowerCase() === emailPrefix ||
          `${e.firstName} ${e.lastName}`.toLowerCase().replace(/\s+/g, '') === emailPrefix ||
          emailPrefix.includes(e.firstName?.toLowerCase())
      );

      // Auto-link found employee record
      if (emp) {
        await db.orm.public.Employee.where({ id: emp.id }).update({ userId: user.id });
      }
    }

    if (emp) {
      employeeId = emp.id;
    }
  } catch (e) {
    console.error("Error finding employee for user:", e);
  }

  return NextResponse.json({
    token,
    user: { id: user.id, email: user.email, role: user.role, employeeId },
  });
}