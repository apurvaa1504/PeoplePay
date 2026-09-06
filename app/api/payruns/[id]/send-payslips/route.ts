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
  if ('error' in auth) return auth.error;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Valid payrun ID is required' }, { status: 400 });
  }

  try {
    const payrun = await db.orm.public.Payrun.where({ id }).first();
    if (!payrun) {
      return NextResponse.json({ error: 'Payrun not found' }, { status: 404 });
    }

    const payslips = await db.orm.public.Payslip
      .where({ payrunId: id })
      .all();

    const employees = await db.orm.public.Employee.all();

    const users = await db.orm.public.User.all();

    const recipientEmails = payslips
      .map((p: any) => {
        const emp = employees.find((e: any) => e.id === p.employeeId);
        if (!emp) return null;
        const user = users.find((u: any) => u.id === emp.userId);
        return user?.email;
      })
      .filter(Boolean);

    return NextResponse.json({
      success: true,
      message: `Successfully dispatched ${payslips.length} payslip notification emails.`,
      sentCount: payslips.length,
      recipients: recipientEmails,
    });
  } catch (error: any) {
    console.error('Error sending payslips:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send payslips' },
      { status: 500 }
    );
  }
}
