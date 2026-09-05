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

    try {
        const payruns = await db.orm.public.Payrun
            .include('structure', (structure) =>
                structure.select('id', 'name', 'active')
            )
            .orderBy((p) => p.createdAt.desc())
            .all();

        const formatted = payruns.map((p) => ({
            id: p.id,
            name: p.name,
            structureId: p.structureId,
            periodStart: p.periodStart,
            periodEnd: p.periodEnd,
            status: p.status,
            createdAt: p.createdAt,
            structure: p.structure,
        }));

        return NextResponse.json(formatted);
    } catch {
        return NextResponse.json(
            { error: 'Failed to fetch payruns' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    const auth = requireAuth(req, ALLOWED_ROLES);

    if ('error' in auth) {
        return auth.error;
    }

    try {
        const body = await req.json();
        const {
            periodStart,
            periodEnd,
            structureId,
            name,
        } = body;

        if (!structureId || typeof structureId !== 'string' || !structureId.trim()) {
            return NextResponse.json(
                { error: 'structureId is required and must be a string' },
                { status: 400 }
            );
        }

        if (!periodStart || typeof periodStart !== 'string') {
            return NextResponse.json(
                { error: 'periodStart is required and must be a valid date string' },
                { status: 400 }
            );
        }

        if (!periodEnd || typeof periodEnd !== 'string') {
            return NextResponse.json(
                { error: 'periodEnd is required and must be a valid date string' },
                { status: 400 }
            );
        }

        const startDate = new Date(periodStart);
        const endDate = new Date(periodEnd);

        if (isNaN(startDate.getTime())) {
            return NextResponse.json(
                { error: 'periodStart must be a valid date' },
                { status: 400 }
            );
        }

        if (isNaN(endDate.getTime())) {
            return NextResponse.json(
                { error: 'periodEnd must be a valid date' },
                { status: 400 }
            );
        }

        if (startDate.getTime() > endDate.getTime()) {
            return NextResponse.json(
                { error: 'periodStart cannot be after periodEnd' },
                { status: 400 }
            );
        }

        const normalizedStructureId = structureId.trim();

        const structure = await db.orm.public.SalaryStructure
            .where({ id: normalizedStructureId })
            .first();

        if (!structure) {
            return NextResponse.json(
                { error: 'Salary structure not found' },
                { status: 404 }
            );
        }

        if (!structure.active) {
            return NextResponse.json(
                { error: 'Cannot create a payrun against an inactive salary structure' },
                { status: 400 }
            );
        }

        // Payrun model in contract.prisma requires 'name: String'.
        // Generate a descriptive default when not supplied in request body.
        const payrunName =
            typeof name === 'string' && name.trim()
                ? name.trim()
                : `${structure.name} (${periodStart.slice(0, 10)} to ${periodEnd.slice(0, 10)})`;

        const created = await db.orm.public.Payrun.create({
            name: payrunName,
            structureId: normalizedStructureId,
            periodStart: startDate.toISOString(),
            periodEnd: endDate.toISOString(),
            status: 'DRAFT',
        });

        return NextResponse.json(
            {
                id: created.id,
                name: created.name,
                structureId: created.structureId,
                periodStart: created.periodStart,
                periodEnd: created.periodEnd,
                status: created.status,
                createdAt: created.createdAt,
                structure: {
                    id: structure.id,
                    name: structure.name,
                    active: structure.active,
                },
            },
            { status: 201 }
        );
    } catch {
        return NextResponse.json(
            { error: 'Failed to create payrun' },
            { status: 500 }
        );
    }
}
