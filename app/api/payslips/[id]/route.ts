import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { requireAuth } from '@/lib/authGuard';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const auth = requireAuth(req, [
    'HR_MANAGER',
    'HR_PAYROLL_USER',
    'HR_PAYROLL_MANAGER',
    'ADMIN',
    'EMPLOYEE',
  ]);

  if ('error' in auth) return auth.error;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Valid payslip ID is required' }, { status: 400 });
  }

  try {
    const payslip = await db.orm.public.Payslip
      .where({ id })
      .include('payrun', (pr) =>
        pr.include('structure', (s) => s.select('id', 'name'))
      )
      .include('lines', (l) => l.orderBy((x) => x.sequence.asc()))
      .first();

    if (!payslip) {
      return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });
    }

    // Role check: If EMPLOYEE role, check against employee record tied to auth user
    if (auth.user.role === 'EMPLOYEE') {
      const employee = await db.orm.public.Employee.where({ userId: auth.user.userId }).first();
      if (!employee || payslip.employeeId !== employee.id) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const employee = await db.orm.public.Employee.where({ id: payslip.employeeId }).first();
    const employeeUser = employee?.userId
      ? await db.orm.public.User.where({ id: employee.userId }).first()
      : null;

    const contract = payslip.contractId
      ? await db.orm.public.Contract.where({ id: payslip.contractId }).first()
      : null;

    const formattedPayslip = {
      ...payslip,
      employee: {
        id: employee?.id || payslip.employeeId,
        firstName: employee?.firstName || 'Employee',
        lastName: employee?.lastName || '',
        workEmail: employeeUser?.email || '',
        department: { name: employee?.department || 'General' },
        jobPosition: { title: employee?.jobPosition || 'Staff' },
      },
      payrun: {
        ...payslip.payrun,
        salaryStructure: payslip.payrun?.structure || { name: 'Standard Structure' },
      },
    };

    return NextResponse.json({ payslip: formattedPayslip, contract });
  } catch (error: any) {
    console.error('Error fetching payslip details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch payslip' },
      { status: 500 }
    );
  }
}
