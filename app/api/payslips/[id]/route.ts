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
  if ('error' in auth) {
    return auth.error;
  }

  const { id: payslipId } = await params;
  if (!payslipId || typeof payslipId !== 'string') {
    return NextResponse.json({ error: 'Valid payslip ID is required' }, { status: 400 });
  }

  try {
    const payslip = await db.orm.public.Payslip.where({ id: payslipId }).first();
    if (!payslip) {
      return NextResponse.json({ error: 'Payslip not found' }, { status: 404 });
    }

    const employee = await db.orm.public.Employee.where({ id: payslip.employeeId }).first();
    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const contract = await db.orm.public.Contract.where({ id: payslip.contractId }).first();
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }

    const payrun = await db.orm.public.Payrun.where({ id: payslip.payrunId }).first();
    if (!payrun) {
      return NextResponse.json({ error: 'Payrun not found' }, { status: 404 });
    }

    const structure = await db.orm.public.SalaryStructure.where({ id: payrun.structureId }).first();

    const lines = await db.orm.public.PayslipLine.where({ payslipId }).all();
    lines.sort((a, b) => a.sequence - b.sequence);

    // Fetch rule details to include name and code
    const rulesList = await db.orm.public.SalaryRule.all();
    const ruleMap = new Map(rulesList.map(r => [r.id, r]));

    const mappedLines = lines.map(line => {
      const rule = ruleMap.get(line.ruleId);
      return {
        id: line.id,
        ruleId: line.ruleId,
        ruleName: rule ? rule.name : 'Unknown Rule',
        ruleCode: rule ? rule.code : 'UNKNOWN',
        category: line.category,
        amount: line.amount,
        sequence: line.sequence,
      };
    });

    return NextResponse.json({
      id: payslip.id,
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        department: employee.department,
        jobPosition: employee.jobPosition,
      },
      contract: {
        id: contract.id,
        startDate: contract.startDate,
        endDate: contract.endDate,
        wage: contract.wage,
      },
      payrun: {
        id: payrun.id,
        name: payrun.name,
        periodStart: payrun.periodStart,
        periodEnd: payrun.periodEnd,
        status: payrun.status,
        structureName: structure ? structure.name : 'Unknown Structure',
      },
      workedDays: payslip.workedDays,
      netSalary: payslip.netSalary,
      warnings: payslip.warnings,
      lines: mappedLines,
    }, { status: 200 });

  } catch (err: unknown) {
    console.error('Payslip details error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch payslip details' },
      { status: 500 }
    );
  }
}
