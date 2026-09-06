import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { requireAuth } from '@/lib/authGuard';
import { or } from '@prisma/orm-postgres/orm-client';

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']);
  if (auth.error) return auth.error;

  const { searchParams } = new URL(req.url);

  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '10', 10) || 10));
  const offset = (page - 1) * pageSize;
  const search = (searchParams.get('search') || '').trim();

  const role = auth.user.role;
  const requestedEmployeeId = searchParams.get('employeeId') || undefined;
  const scopedEmployeeId = role === 'EMPLOYEE' ? auth.user.employeeId : requestedEmployeeId;

  let matchedEmployeeIds: string[] | null = null;
  if (search) {
    const matches = await db.orm.public.Employee
      .where((e) => or(e.firstName.ilike(`%${search}%`), e.lastName.ilike(`%${search}%`)))
      .select('id')
      .all();
    matchedEmployeeIds = matches.map((e) => e.id);

    if (matchedEmployeeIds.length === 0) {
      return NextResponse.json({
        requests: [],
        pagination: { page, pageSize, total: 0, totalPages: 1 },
      });
    }

    if (scopedEmployeeId && !matchedEmployeeIds.includes(scopedEmployeeId)) {
      return NextResponse.json({
        requests: [],
        pagination: { page, pageSize, total: 0, totalPages: 1 },
      });
    }
  }

  function scopedRequests() {
    let q = db.orm.public.TimeOffRequest;
    if (scopedEmployeeId) {
      q = q.where({ employeeId: scopedEmployeeId });
    } else if (matchedEmployeeIds) {
      q = q.where((r) => r.employeeId.in(matchedEmployeeIds as string[]));
    }
    return q;
  }

  const [pendingCount, decidedCount] = await Promise.all([
    scopedRequests().where({ status: 'PENDING' }).aggregate((a) => ({ total: a.count() })),
    scopedRequests().where((r) => r.status.neq('PENDING')).aggregate((a) => ({ total: a.count() })),
  ]);

  const pendingTotal = pendingCount.total;
  const decidedTotal = decidedCount.total;
  const total = pendingTotal + decidedTotal;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const windowStart = offset;
  const windowEnd = offset + pageSize;

  const requests: any[] = [];

  const pendingSliceStart = Math.min(windowStart, pendingTotal);
  const pendingSliceEnd = Math.min(windowEnd, pendingTotal);
  if (pendingSliceEnd > pendingSliceStart) {
    const pendingRows = await scopedRequests()
      .where({ status: 'PENDING' })
      .orderBy((r) => r.createdAt.desc())
      .limit(pendingSliceEnd - pendingSliceStart)
      .offset(pendingSliceStart)
      .all();
    requests.push(...pendingRows);
  }

  const decidedSliceStart = Math.max(0, Math.min(windowStart - pendingTotal, decidedTotal));
  const decidedSliceEnd = Math.max(0, Math.min(windowEnd - pendingTotal, decidedTotal));
  if (decidedSliceEnd > decidedSliceStart) {
    const decidedRows = await scopedRequests()
      .where((r) => r.status.neq('PENDING'))
      .orderBy((r) => r.createdAt.desc())
      .limit(decidedSliceEnd - decidedSliceStart)
      .offset(decidedSliceStart)
      .all();
    requests.push(...decidedRows);
  }

  return NextResponse.json({
    requests,
    pagination: { page, pageSize, total, totalPages },
  });
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