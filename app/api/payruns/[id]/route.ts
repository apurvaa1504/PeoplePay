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

    const { id: payrunId } = await params;

    if (!payrunId || typeof payrunId !== 'string') {
        return NextResponse.json(
            { error: 'Valid payrun ID is required' },
            { status: 400 }
        );
    }

    try {
        const payrun = await db.orm.public.Payrun.where({
            id: payrunId,
        }).first();

        if (!payrun) {
            return NextResponse.json(
                { error: 'Payrun not found' },
                { status: 404 }
            );
        }

        const structure = await db.orm.public.SalaryStructure.where({
            id: payrun.structureId,
        }).first();

        const payslips = await db.orm.public.Payslip.where({
            payrunId,
        }).all();

        const employees = await db.orm.public.Employee.all();
        const employeeMap = new Map(
            employees.map((employee) => [employee.id, employee])
        );

        const formattedPayslips = payslips.map((payslip) => {
            const employee = employeeMap.get(payslip.employeeId);

            return {
                id: payslip.id,
                employeeId: payslip.employeeId,
                employee: employee
                    ? {
                        id: employee.id,
                        firstName: employee.firstName,
                        lastName: employee.lastName,
                        department: employee.department,
                        jobPosition: employee.jobPosition,
                    }
                    : null,
                contractId: payslip.contractId,
                netSalary: payslip.netSalary,
                workedDays: payslip.workedDays,
                warnings: payslip.warnings,
            };
        });

        return NextResponse.json(
            {
                id: payrun.id,
                name: payrun.name,
                structureId: payrun.structureId,
                structureName: structure?.name ?? 'Unknown Structure',
                periodStart: payrun.periodStart,
                periodEnd: payrun.periodEnd,
                status: payrun.status,
                createdAt: payrun.createdAt,
                payslips: formattedPayslips,
                summary: {
                    employeeCount: formattedPayslips.length,
                    totalNetSalary: formattedPayslips.reduce(
                        (total, payslip) => total + payslip.netSalary,
                        0
                    ),
                    warningCount: formattedPayslips.filter(
                        (payslip) => Boolean(payslip.warnings)
                    ).length,
                },
            },
            { status: 200 }
        );
    } catch (err: unknown) {
        console.error('Payrun details error:', err);

        return NextResponse.json(
            { error: 'Failed to fetch payrun details' },
            { status: 500 }
        );
    }
}