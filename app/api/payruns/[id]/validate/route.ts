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

    if (payrun.status !== 'COMPUTED') {
      return NextResponse.json(
        { error: `Cannot validate a payrun in ${payrun.status} status. Only COMPUTED is allowed.` },
        { status: 400 }
      );
    }

    const allPayslips = await db.orm.public.Payslip.where({ payrunId }).all();
    
    if (allPayslips.length === 0) {
      return NextResponse.json({
        valid: false,
        errors: ["No payslips found in this payrun. Computation must generate at least one payslip."],
        warnings: []
      }, { status: 400 });
    }

    const allEmployees = await db.orm.public.Employee.all();
    const allContracts = await db.orm.public.Contract.all();
    const allLines = await db.orm.public.PayslipLine.all();
    
    const employeeMap = new Map(allEmployees.map(e => [e.id, e]));
    const contractMap = new Map(allContracts.map(c => [c.id, c]));

    const errors: string[] = [];
    const warnings: string[] = [];
    const employeeIdsInPayrun = new Set<string>();

    for (const payslip of allPayslips) {
      // Collect warnings
      if (payslip.warnings) {
        warnings.push(`Payslip ${payslip.id}: ${payslip.warnings}`);
      }

      // Check duplicate employee
      if (employeeIdsInPayrun.has(payslip.employeeId)) {
        errors.push(`Duplicate payslip found for employee ${payslip.employeeId}.`);
      }
      employeeIdsInPayrun.add(payslip.employeeId);

      // Validate Employee
      const emp = employeeMap.get(payslip.employeeId);
      if (!emp) {
        errors.push(`Employee ${payslip.employeeId} on payslip ${payslip.id} does not exist.`);
      }

      // Validate Contract
      const contract = contractMap.get(payslip.contractId);
      if (!contract) {
        errors.push(`Contract ${payslip.contractId} on payslip ${payslip.id} does not exist.`);
      } else if (contract.employeeId !== payslip.employeeId) {
        errors.push(`Contract ${contract.id} belongs to employee ${contract.employeeId}, not ${payslip.employeeId}.`);
      } else {
        const payrunStartMs = new Date(payrun.periodStart).getTime();
        const payrunEndMs = new Date(payrun.periodEnd).getTime();
        const cStartMs = new Date(contract.startDate).getTime();
        const cEndMs = contract.endDate ? new Date(contract.endDate).getTime() : null;
        if (!(cStartMs <= payrunEndMs && (cEndMs === null || cEndMs >= payrunStartMs))) {
          errors.push(`Contract ${contract.id} does not cover the payrun period for employee ${payslip.employeeId}.`);
        }
      }

      // Validate Lines
      const lines = allLines.filter(l => l.payslipId === payslip.id);
      if (lines.length === 0) {
        errors.push(`Payslip ${payslip.id} has no calculation lines.`);
      }

      // Validate Net Salary
      if (typeof payslip.netSalary !== 'number' || !isFinite(payslip.netSalary)) {
        errors.push(`Payslip ${payslip.id} has an invalid net salary.`);
      } else if (payslip.netSalary < 0) {
        errors.push(`Payslip ${payslip.id} has a negative net salary (${payslip.netSalary}).`);
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({
        valid: false,
        errors,
        warnings
      }, { status: 400 });
    }

    // Success - update status transactionally
    await db.transaction(async (tx) => {
      await tx.orm.public.Payrun.where({ id: payrunId }).update({ status: 'VALIDATED' });
    });

    const updatedPayrun = await db.orm.public.Payrun.where({ id: payrunId }).first();

    return NextResponse.json({
      valid: true,
      errors: [],
      warnings,
      payrun: updatedPayrun
    }, { status: 200 });

  } catch (err: unknown) {
    console.error('Validation error:', err);
    return NextResponse.json(
      { error: 'Failed to validate payrun' },
      { status: 500 }
    );
  }
}
