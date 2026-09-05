import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { requireAuth } from '@/lib/authGuard';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(req, ['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']);
  if (auth.error) return auth.error;

  const type = await db.orm.public.TimeOffType.where({ id }).first();
  if (!type) {
    return NextResponse.json({ error: 'Time off type not found' }, { status: 404 });
  }

  return NextResponse.json({ timeOffType: type });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(req, ['HR_MANAGER', 'ADMIN']);
  if (auth.error) return auth.error;

  const existing = await db.orm.public.TimeOffType.where({ id }).first();
  if (!existing) {
    return NextResponse.json({ error: 'Time off type not found' }, { status: 404 });
  }

  const body = await req.json();

  const updated = await db.orm.public.TimeOffType.where({ id }).update({
    name: body.name ?? existing.name,
    requiresApproval: body.requiresApproval ?? existing.requiresApproval,
    payrollIntegration: body.payrollIntegration ?? existing.payrollIntegration,
  });

  return NextResponse.json({ timeOffType: updated });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(req, ['HR_MANAGER', 'ADMIN']);
  if (auth.error) return auth.error;

  const existing = await db.orm.public.TimeOffType.where({ id }).first();
  if (!existing) {
    return NextResponse.json({ error: 'Time off type not found' }, { status: 404 });
  }

  await db.orm.public.TimeOffType.where({ id }).delete();
  return NextResponse.json({ success: true });
}