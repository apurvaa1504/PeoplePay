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

export async function GET(req: NextRequest, { params }: RouteContext) {
  const auth = requireAuth(req, ALLOWED_ROLES);
  if ('error' in auth) return auth.error;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Valid payrun ID is required' }, { status: 400 });
  }

  try {
    const payrun = await db.orm.public.Payrun
      .where({ id })
      .include('structure', (s) => s.select('id', 'name', 'active'))
      .first();

    if (!payrun) {
      return NextResponse.json({ error: 'Payrun not found' }, { status: 404 });
    }

    // Fetch all payslips for this payrun
    const allPayslips = await db.orm.public.Payslip
      .where({ payrunId: id })
      .include('lines', (l) => l.orderBy((x) => x.sequence.asc()))
      .all();

    // Fetch employees to enrich payslips
    const allEmployees = await db.orm.public.Employee.all();
    const allContracts = await db.orm.public.Contract.all();

    const enrichedPayslips = allPayslips.map((p: any) => {
      const emp = allEmployees.find((e: any) => e.id === p.employeeId);
      const contract = allContracts.find((c: any) => c.id === p.contractId);

      // Extract Gross, Deductions, Basic from lines
      const basicLine = p.lines?.find((l: any) => l.category === 'BASIC');
      const allowanceLines = p.lines?.filter((l: any) => l.category === 'ALLOWANCE') || [];
      const deductionLines = p.lines?.filter((l: any) => l.category === 'DEDUCTION') || [];

      const basic = basicLine ? basicLine.amount : (contract?.wage ? Math.round(contract.wage * 0.5) : (p.netSalary || 0));
      const allowances = allowanceLines.reduce((sum: number, l: any) => sum + (l.amount || 0), 0);
      const deductions = deductionLines.reduce((sum: number, l: any) => sum + (l.amount || 0), 0);
      const gross = basicLine || allowanceLines.length ? (basic + allowances) : (p.netSalary || 0);

      return {
        id: p.id,
        employeeId: p.employeeId,
        employee: emp ? { id: emp.id, firstName: emp.firstName, lastName: emp.lastName, department: emp.department, jobPosition: emp.jobPosition } : null,
        contractId: p.contractId,
        contract: contract ? { id: contract.id, wage: contract.wage, status: contract.status } : null,
        netSalary: p.netSalary,
        workedDays: p.workedDays,
        warnings: p.warnings ? p.warnings.split(';').map((w: string) => w.trim()).filter(Boolean) : [],
        basic,
        allowances,
        deductions,
        gross,
        lines: p.lines,
        createdAt: p.createdAt,
      };
    });

    const totalNet = enrichedPayslips.reduce((sum: number, p: any) => sum + (p.netSalary || 0), 0);
    const totalGross = enrichedPayslips.reduce((sum: number, p: any) => sum + (p.gross || 0), 0);
    const totalDeductions = enrichedPayslips.reduce((sum: number, p: any) => sum + (p.deductions || 0), 0);
    const warningCount = enrichedPayslips.filter((p: any) => p.warnings && p.warnings.length > 0).length;

    return NextResponse.json({
      payrun: {
        id: payrun.id,
        name: payrun.name,
        structureId: payrun.structureId,
        structure: payrun.structure,
        periodStart: payrun.periodStart,
        periodEnd: payrun.periodEnd,
        status: payrun.status,
        createdAt: payrun.createdAt,
      },
      payslips: enrichedPayslips,
      metrics: {
        totalPayslips: enrichedPayslips.length,
        totalNet,
        totalGross,
        totalDeductions,
        warningCount,
      },
    });
  } catch (error: any) {
    console.error('Error fetching payrun details:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch payrun' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const auth = requireAuth(req, ALLOWED_ROLES);
  if ('error' in auth) return auth.error;

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: 'Valid payrun ID is required' }, { status: 400 });
  }

  try {
    const { status } = await req.json();
    const VALID_STATUSES = ['DRAFT', 'COMPUTED', 'VALIDATED', 'PAID'];

    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }

    const payrun = await db.orm.public.Payrun.where({ id }).first();
    if (!payrun) {
      return NextResponse.json({ error: 'Payrun not found' }, { status: 404 });
    }

    const updated = await db.orm.public.Payrun.where({ id }).update({ status });
    return NextResponse.json({ payrun: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to update payrun status' }, { status: 500 });
  }
}
