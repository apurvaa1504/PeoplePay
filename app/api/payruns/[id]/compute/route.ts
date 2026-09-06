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
    let employeeIds: string[] = [];
    try {
      const body = await req.json();
      if (Array.isArray(body?.employeeIds)) {
        employeeIds = body.employeeIds;
      }
    } catch {
      // Empty or no json body - will auto-populate active employees below
    }

    // Fetch Payrun
    const payrun = await db.orm.public.Payrun.where({ id: payrunId }).first();
    if (!payrun) {
      return NextResponse.json({ error: 'Payrun not found' }, { status: 404 });
    }

    // If no employeeIds supplied, find all employees with active contracts in this period
    if (employeeIds.length === 0) {
      const allContracts = await db.orm.public.Contract.all();
      const pStart = new Date(payrun.periodStart).getTime();
      const pEnd = new Date(payrun.periodEnd).getTime();
      const matching = allContracts.filter(c => {
        const cStart = new Date(c.startDate).getTime();
        const cEnd = c.endDate ? new Date(c.endDate).getTime() : null;
        return cStart <= pEnd && (cEnd === null || cEnd >= pStart);
      });
      employeeIds = Array.from(new Set(matching.map(c => c.employeeId)));
    }

    if (employeeIds.length === 0) {
      return NextResponse.json(
        { error: 'No eligible employees found with active contracts for this payrun period.' },
        { status: 400 }
      );
    }
    if (payrun.status !== 'DRAFT') {
      return NextResponse.json(
        { error: `Cannot compute a payrun in ${payrun.status} status. Only DRAFT is allowed.` },
        { status: 400 }
      );
    }

    // Fetch structure rules ordered by sequence
    const structureRules = await db.orm.public.SalaryStructureRule
      .where({ structureId: payrun.structureId })
      .include('rule', (r) => r.select('id', 'name', 'code', 'category', 'computationMethod', 'fixedAmount', 'percentage', 'formula'))
      .orderBy((r) => r.sequence.asc())
      .all();

    // Deduplicate employee IDs
    const uniqueEmployeeIds = Array.from(new Set(employeeIds as string[]));

    // Fetch employees safely to avoid TS `{in}` error by fetching all and filtering
    const allEmployees = await db.orm.public.Employee.all();
    const employees = allEmployees.filter(e => uniqueEmployeeIds.includes(e.id));
    const employeeMap = new Map(employees.map(e => [e.id, e]));

    // Fetch contracts
    const allContracts = await db.orm.public.Contract.all();
    const contracts = allContracts.filter(c => uniqueEmployeeIds.includes(c.employeeId));

    // Fetch existing payslips
    const allPayslips = await db.orm.public.Payslip.all();
    const existingPayslips = allPayslips.filter(p => p.payrunId === payrunId && uniqueEmployeeIds.includes(p.employeeId));
    const existingPayslipEmpIds = new Set(existingPayslips.map(p => p.employeeId));

    const payrunStart = new Date(payrun.periodStart).getTime();
    const payrunEnd = new Date(payrun.periodEnd).getTime();

    const generatedPayslips: Record<string, unknown>[] = [];
    const warnings: string[] = [];
    let totalNetSummary = 0;

    // Use transaction for all creates/updates
    await db.transaction(async (tx) => {
      for (const empId of uniqueEmployeeIds) {
        if (!employeeMap.has(empId)) {
          warnings.push(`Employee ${empId} not found.`);
          continue;
        }
        if (existingPayslipEmpIds.has(empId)) {
          warnings.push(`Employee ${empId} already has a payslip in this payrun.`);
          continue;
        }

        // Find applicable contract
        const empContracts = contracts.filter(c => {
          if (c.employeeId !== empId) return false;
          const cStart = new Date(c.startDate).getTime();
          const cEnd = c.endDate ? new Date(c.endDate).getTime() : null;
          return cStart <= payrunEnd && (cEnd === null || cEnd >= payrunStart);
        });

        if (empContracts.length === 0) {
          warnings.push(`Employee ${empId} has no applicable contract for this period.`);
          continue;
        }

        // Prefer ACTIVE
        empContracts.sort((a, b) => {
          if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1;
          if (b.status === 'ACTIVE' && a.status !== 'ACTIVE') return 1;
          return 0;
        });
        const activeContract = empContracts[0];

        // Payroll Calculation Context
        const context: Record<string, number> = {};
        const categories = {
          BASIC: 0,
          ALLOWANCE: 0,
          GROSS: 0,
          DEDUCTION: 0,
          NET: 0,
        };
        let explicitGross = false;
        let explicitNet = false;
        type SalaryCategory = "BASIC" | "ALLOWANCE" | "GROSS" | "DEDUCTION" | "NET";
        const linesToCreate: { ruleId: string; category: SalaryCategory; amount: number; sequence: number }[] = [];
        let empWarnings = "";

        for (const sr of structureRules) {
          const rule = sr.rule;
          if (!rule) continue;
          
          let amount = 0;

          if (rule.computationMethod === 'FIXED') {
            amount = rule.fixedAmount || 0;
          } else if (rule.computationMethod === 'PERCENTAGE') {
            let baseKey = rule.formula ? rule.formula.trim() : "";
            if (!baseKey && rule.category === 'ALLOWANCE') {
              baseKey = 'BASIC';
            }
            const baseValue = baseKey ? (context[baseKey] || categories[baseKey as keyof typeof categories] || 0) : 0;
            amount = baseValue * ((rule.percentage || 0) / 100);
          } else if (rule.computationMethod === 'FORMULA') {
            empWarnings += `Formula rules are not supported yet (${rule.code}). `;
            amount = 0;
          }

          context[rule.code] = amount;

          // Add to categories
          if (rule.category === 'BASIC') categories.BASIC += amount;
          else if (rule.category === 'ALLOWANCE') categories.ALLOWANCE += amount;
          else if (rule.category === 'DEDUCTION') categories.DEDUCTION += amount;
          else if (rule.category === 'GROSS') {
            categories.GROSS += amount;
            context.GROSS = categories.GROSS;
            explicitGross = true;
          } else if (rule.category === 'NET') {
            categories.NET += amount;
            context.NET = categories.NET;
            explicitNet = true;
          }

          linesToCreate.push({
            ruleId: rule.id,
            category: rule.category as SalaryCategory,
            amount,
            sequence: sr.sequence,
          });
        }

        // Derive GROSS / NET if explicit rules didn't exist
        if (!explicitGross) {
          categories.GROSS = categories.BASIC + categories.ALLOWANCE;
          context.GROSS = categories.GROSS;
        }
        if (!explicitNet) {
          categories.NET = categories.GROSS - categories.DEDUCTION;
          context.NET = categories.NET;
        }

        const netSalary = categories.NET;
        totalNetSummary += netSalary;

        // Create Payslip
        const payslip = await tx.orm.public.Payslip.create({
          payrunId,
          employeeId: empId,
          contractId: activeContract.id,
          netSalary,
          workedDays: 0,
          warnings: empWarnings.trim() || null,
        });

        // Create lines
        const finalLines = [];
        for (const line of linesToCreate) {
          const createdLine = await tx.orm.public.PayslipLine.create({
            payslipId: payslip.id,
            ruleId: line.ruleId,
            category: line.category,
            amount: line.amount,
            sequence: line.sequence,
          });
          finalLines.push(createdLine);
        }

        generatedPayslips.push({
          ...payslip,
          lines: finalLines,
        });
      }

      // Update Payrun Status
      if (generatedPayslips.length > 0) {
        await tx.orm.public.Payrun.where({ id: payrunId }).update({ status: 'COMPUTED' });
      }
    });

    if (generatedPayslips.length === 0) {
      return NextResponse.json(
        { error: 'No payslips were generated. Check warnings for details.', warnings },
        { status: 400 }
      );
    }

    const updatedPayrun = await db.orm.public.Payrun.where({ id: payrunId }).first();

    return NextResponse.json({
      payrun: updatedPayrun,
      payslips: generatedPayslips,
      warnings,
      summary: {
        totalNet: totalNetSummary,
        payslipsGenerated: generatedPayslips.length,
      },
    }, { status: 200 });

  } catch (error: unknown) {
    console.error('Computation error:', error);
    return NextResponse.json(
      { error: 'Failed to compute payrun' },
      { status: 500 }
    );
  }
}
