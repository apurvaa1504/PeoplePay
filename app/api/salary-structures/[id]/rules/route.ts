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

    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json(
            { error: 'Valid salary structure ID is required' },
            { status: 400 }
        );
    }

    try {
        const structure = await db.orm.public.SalaryStructure
            .where({ id })
            .first();

        if (!structure) {
            return NextResponse.json(
                { error: 'Salary structure not found' },
                { status: 404 }
            );
        }

        const structureRules = await db.orm.public.SalaryStructureRule
            .where({ structureId: id })
            .include('rule', (rule) =>
                rule.select(
                    'id',
                    'name',
                    'code',
                    'category',
                    'computationMethod',
                    'fixedAmount',
                    'percentage',
                    'formula'
                )
            )
            .orderBy((r) => r.sequence.asc())
            .all();

        return NextResponse.json(structureRules);
    } catch {
        return NextResponse.json(
            { error: 'Failed to fetch salary structure rules' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
    const auth = requireAuth(req, ALLOWED_ROLES);

    if ('error' in auth) {
        return auth.error;
    }

    const { id } = await params;

    if (!id || typeof id !== 'string') {
        return NextResponse.json(
            { error: 'Valid salary structure ID is required' },
            { status: 400 }
        );
    }

    try {
        const body = await req.json();
        const { ruleId, sequence } = body;

        if (!ruleId || typeof ruleId !== 'string' || !ruleId.trim()) {
            return NextResponse.json(
                { error: 'ruleId is required and must be a string' },
                { status: 400 }
            );
        }

        if (
            sequence === undefined ||
            sequence === null ||
            typeof sequence !== 'number' ||
            !Number.isInteger(sequence) ||
            sequence < 0
        ) {
            return NextResponse.json(
                { error: 'sequence is required and must be a non-negative integer' },
                { status: 400 }
            );
        }

        const normalizedRuleId = ruleId.trim();

        const structure = await db.orm.public.SalaryStructure
            .where({ id })
            .first();

        if (!structure) {
            return NextResponse.json(
                { error: 'Salary structure not found' },
                { status: 404 }
            );
        }

        const rule = await db.orm.public.SalaryRule
            .where({ id: normalizedRuleId })
            .first();

        if (!rule) {
            return NextResponse.json(
                { error: 'Salary rule not found' },
                { status: 404 }
            );
        }

        const existingLink = await db.orm.public.SalaryStructureRule
            .where({ structureId: id, ruleId: normalizedRuleId })
            .first();

        if (existingLink) {
            return NextResponse.json(
                { error: 'This salary rule is already assigned to this salary structure' },
                { status: 409 }
            );
        }

        const created = await db.orm.public.SalaryStructureRule.create({
            structureId: id,
            ruleId: normalizedRuleId,
            sequence,
        });

        return NextResponse.json(
            {
                ...created,
                rule: {
                    id: rule.id,
                    name: rule.name,
                    code: rule.code,
                    category: rule.category,
                    computationMethod: rule.computationMethod,
                    fixedAmount: rule.fixedAmount,
                    percentage: rule.percentage,
                    formula: rule.formula,
                },
            },
            { status: 201 }
        );
    } catch {
        return NextResponse.json(
            { error: 'Failed to assign salary rule to structure' },
            { status: 500 }
        );
    }
}
