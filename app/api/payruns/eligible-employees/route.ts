import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { requireAuth } from '@/lib/authGuard';

const ALLOWED_ROLES = [
  'HR_MANAGER',
  'HR_PAYROLL_USER',
  'HR_PAYROLL_MANAGER',
  'ADMIN',
];

export async function GET(req: NextRequest) {
  const auth = requireAuth(req, ALLOWED_ROLES);
  if ('error' in auth) {
    return auth.error;
  }

  const { searchParams } = new URL(req.url);
  const structureId = searchParams.get('structureId');
  const periodStart = searchParams.get('periodStart');
  const periodEnd = searchParams.get('periodEnd');

  if (!structureId || typeof structureId !== 'string') {
    return NextResponse.json({ error: 'structureId is required' }, { status: 400 });
  }

  const normalizedStructureId = structureId.trim();

  if (!periodStart || !periodEnd) {
    return NextResponse.json({ error: 'periodStart and periodEnd are required' }, { status: 400 });
  }

  const startDate = new Date(periodStart);
  const endDate = new Date(periodEnd);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: 'Invalid period dates' }, { status: 400 });
  }

  if (startDate.getTime() > endDate.getTime()) {
    return NextResponse.json({ error: "periodStart cannot be after periodEnd" }, { status: 400 });
  }

  try {
    const structure = await db.orm.public.SalaryStructure.where({ id: normalizedStructureId }).first();
    if (!structure || !structure.active) {
      return NextResponse.json(
        { error: 'Salary structure not found or is inactive' },
        { status: 404 }
      );
    }

    const allContracts = await db.orm.public.Contract.where({ structureId: normalizedStructureId }).all();
    
    // Filter applicable contracts based on dates
    const startMs = startDate.getTime();
    const endMs = endDate.getTime();
    
    const validContracts = allContracts.filter(c => {
      const cStart = new Date(c.startDate).getTime();
      const cEnd = c.endDate ? new Date(c.endDate).getTime() : null;
      return cStart <= endMs && (cEnd === null || cEnd >= startMs);
    });

    if (validContracts.length === 0) {
      return NextResponse.json([]);
    }

    // Prefer ACTIVE contract per employee
    const contractByEmployee = new Map<string, typeof validContracts[0]>();
    
    for (const c of validContracts) {
      const existing = contractByEmployee.get(c.employeeId);
      if (!existing) {
        contractByEmployee.set(c.employeeId, c);
      } else {
        if (c.status === 'ACTIVE' && existing.status !== 'ACTIVE') {
          contractByEmployee.set(c.employeeId, c);
        }
      }
    }

    const validEmployeeIds = Array.from(contractByEmployee.keys());

    const allEmployees = await db.orm.public.Employee.all();
    const employees = allEmployees.filter(e => validEmployeeIds.includes(e.id));

    const result = employees.map(emp => {
      const contract = contractByEmployee.get(emp.id);
      return {
        id: emp.id,
        firstName: emp.firstName,
        lastName: emp.lastName,
        department: emp.department,
        jobPosition: emp.jobPosition,
        contractId: contract?.id
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch eligible employees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch eligible employees' },
      { status: 500 }
    );
  }
}
