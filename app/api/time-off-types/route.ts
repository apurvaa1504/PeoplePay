import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { requireAuth } from '@/lib/authGuard';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']);
  if (auth.error) return auth.error;

  const types = await db.orm.public.TimeOffType.all();
  return NextResponse.json({ timeOffTypes: types });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['HR_MANAGER', 'ADMIN']);
  if (auth.error) return auth.error;

  const { name, unit, requiresAllocation, requiresApproval, payrollIntegration } = await req.json();

  if (!name) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }

  const type = await db.orm.public.TimeOffType.create({
    name,
    unit: unit ?? 'DAYS',
    requiresAllocation: requiresAllocation ?? true,
    requiresApproval: requiresApproval ?? true,
    payrollIntegration: payrollIntegration ?? false,
  });

  return NextResponse.json({ timeOffType: type }, { status: 201 });
}