import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { requireAuth } from '@/lib/authGuard';

const ALLOWED_ROLES = [
  'HR_MANAGER',
  'HR_PAYROLL_USER',
  'HR_PAYROLL_MANAGER',
  'ADMIN',
];

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const auth = requireAuth(req, ALLOWED_ROLES);
  if ('error' in auth) {
    return auth.error;
  }

  const { id: payrunId } = await params;
  if (!payrunId || typeof payrunId !== 'string') {
    return NextResponse.json({ error: 'Valid payrun ID is required' }, { status: 400 });
  }

  try {
    const payrun = await db.orm.public.Payrun.where({ id: payrunId }).first();
    if (!payrun) {
      return NextResponse.json({ error: 'Payrun not found' }, { status: 404 });
    }

    if (payrun.status !== 'VALIDATED') {
      return NextResponse.json(
        { error: `Cannot mark a payrun as paid in ${payrun.status} status. Only VALIDATED is allowed.` },
        { status: 400 }
      );
    }

    // Success - update status transactionally
    await db.transaction(async (tx) => {
      await tx.orm.public.Payrun.where({ id: payrunId }).update({ status: 'PAID' });
    });

    const updatedPayrun = await db.orm.public.Payrun.where({ id: payrunId }).first();

    return NextResponse.json({
      payrun: updatedPayrun
    }, { status: 200 });

  } catch (err: unknown) {
    console.error('Mark paid error:', err);
    return NextResponse.json(
      { error: 'Failed to mark payrun as paid' },
      { status: 500 }
    );
  }
}
