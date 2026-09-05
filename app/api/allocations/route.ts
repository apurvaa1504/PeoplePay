import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { requireAuth } from '@/lib/authGuard';

function withRemaining(allocation: any) {
  return { ...allocation, remaining: allocation.allocated - allocation.taken };
}

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']);
  if (auth.error) return auth.error;

  const allocations = await db.orm.public.Allocation.all();
  return NextResponse.json({ allocations: allocations.map(withRemaining) });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['HR_MANAGER', 'ADMIN']);
  if (auth.error) return auth.error;

  const { employeeId, timeOffTypeId, allocated, validFrom, validTo } = await req.json();

  if (!employeeId || !timeOffTypeId || allocated == null || !validFrom) {
    return NextResponse.json(
      { error: 'employeeId, timeOffTypeId, allocated, and validFrom are required' },
      { status: 400 }
    );
  }

  const employee = await db.orm.public.Employee.where({ id: employeeId }).first();
  if (!employee) {
    return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
  }

  const timeOffType = await db.orm.public.TimeOffType.where({ id: timeOffTypeId }).first();
  if (!timeOffType) {
    return NextResponse.json({ error: 'Time off type not found' }, { status: 404 });
  }

  const allocation = await db.orm.public.Allocation.create({
    employeeId,
    timeOffTypeId,
    allocated,
    taken: 0,
    validFrom,
    validTo: validTo ?? null,
  });

  return NextResponse.json({ allocation: withRemaining(allocation) }, { status: 201 });
}