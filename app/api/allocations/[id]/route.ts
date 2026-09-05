import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { requireAuth } from '@/lib/authGuard';

function withRemaining(allocation: any) {
  return { ...allocation, remaining: allocation.allocated - allocation.taken };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(req, ['EMPLOYEE', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'ADMIN']);
  if (auth.error) return auth.error;

  const allocation = await db.orm.public.Allocation.where({ id }).first();
  if (!allocation) {
    return NextResponse.json({ error: 'Allocation not found' }, { status: 404 });
  }

  return NextResponse.json({ allocation: withRemaining(allocation) });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(req, ['HR_MANAGER', 'ADMIN']);
  if (auth.error) return auth.error;

  const existing = await db.orm.public.Allocation.where({ id }).first();
  if (!existing) {
    return NextResponse.json({ error: 'Allocation not found' }, { status: 404 });
  }

  const body = await req.json();

  const updated = await db.orm.public.Allocation.where({ id }).update({
    allocated: body.allocated ?? existing.allocated,
    validFrom: body.validFrom ?? existing.validFrom,
    validTo: body.validTo ?? existing.validTo,
  });

  return NextResponse.json({ allocation: withRemaining(updated) });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = requireAuth(req, ['HR_MANAGER', 'ADMIN']);
  if (auth.error) return auth.error;

  const existing = await db.orm.public.Allocation.where({ id }).first();
  if (!existing) {
    return NextResponse.json({ error: 'Allocation not found' }, { status: 404 });
  }

  await db.orm.public.Allocation.where({ id }).delete();
  return NextResponse.json({ success: true });
}