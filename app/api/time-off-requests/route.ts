import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { requireAuth } from '@/lib/authGuard';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']);
  if (auth.error) return auth.error;

  const requests = await db.orm.public.TimeOffRequest.all();
  return NextResponse.json({ requests });
}

export async function POST(req: NextRequest) {
  const auth = requireAuth(req, ['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']);
  if (auth.error) return auth.error;

  const { employeeId, timeOffTypeId, startDate, endDate, duration } = await req.json();

  if (!employeeId || !timeOffTypeId || !startDate || !endDate || duration == null) {
    return NextResponse.json(
      { error: 'employeeId, timeOffTypeId, startDate, endDate, and duration are required' },
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

  const request = await db.orm.public.TimeOffRequest.create({
    employeeId,
    timeOffTypeId,
    startDate,
    endDate,
    duration,
    status: 'PENDING',
  });

  return NextResponse.json({ request }, { status: 201 });
}