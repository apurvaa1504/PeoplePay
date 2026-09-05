import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { requireAuth } from '@/lib/authGuard';

const ALLOWED_ROLES = [
    'HR_MANAGER',
    'HR_PAYROLL_USER',
    'HR_PAYROLL_MANAGER',
    'ADMIN',
];

const VALID_CATEGORIES = ['BASIC', 'ALLOWANCE', 'GROSS', 'DEDUCTION', 'NET'] as const;
const VALID_COMPUTATION_METHODS = ['FIXED', 'PERCENTAGE', 'FORMULA'] as const;

type SalaryCategory = (typeof VALID_CATEGORIES)[number];
type ComputationMethod = (typeof VALID_COMPUTATION_METHODS)[number];

export async function GET(req: NextRequest) {
    const auth = requireAuth(req, ALLOWED_ROLES);

    if ('error' in auth) {
        return auth.error;
    }

    try {
        const rules = await db.orm.public.SalaryRule
            .select(
                'id',
                'name',
                'code',
                'category',
                'computationMethod',
                'fixedAmount',
                'percentage',
                'formula'
            )
            .all();

        return NextResponse.json(rules);
    } catch {
        return NextResponse.json(
            { error: 'Failed to fetch salary rules' },
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
            name,
            code,
            category,
            computationMethod,
            fixedAmount,
            percentage,
            formula,
        } = body;

        if (!name || typeof name !== 'string' || !name.trim()) {
            return NextResponse.json(
                { error: 'Name is required' },
                { status: 400 }
            );
        }

        if (!code || typeof code !== 'string' || !code.trim()) {
            return NextResponse.json(
                { error: 'Code is required' },
                { status: 400 }
            );
        }

        if (!category || !VALID_CATEGORIES.includes(category as SalaryCategory)) {
            return NextResponse.json(
                {
                    error: `Category is required and must be one of: ${VALID_CATEGORIES.join(', ')}`,
                },
                { status: 400 }
            );
        }

        if (
            !computationMethod ||
            !VALID_COMPUTATION_METHODS.includes(computationMethod as ComputationMethod)
        ) {
            return NextResponse.json(
                {
                    error: `Computation method is required and must be one of: ${VALID_COMPUTATION_METHODS.join(', ')}`,
                },
                { status: 400 }
            );
        }

        if (
            fixedAmount !== undefined &&
            fixedAmount !== null &&
            typeof fixedAmount !== 'number'
        ) {
            return NextResponse.json(
                { error: 'fixedAmount must be a number' },
                { status: 400 }
            );
        }

        if (
            percentage !== undefined &&
            percentage !== null &&
            typeof percentage !== 'number'
        ) {
            return NextResponse.json(
                { error: 'percentage must be a number' },
                { status: 400 }
            );
        }

        if (
            formula !== undefined &&
            formula !== null &&
            typeof formula !== 'string'
        ) {
            return NextResponse.json(
                { error: 'formula must be a string' },
                { status: 400 }
            );
        }

        const normalizedCode = code.trim();

        const existing = await db.orm.public.SalaryRule
            .where({ code: normalizedCode })
            .first();

        if (existing) {
            return NextResponse.json(
                { error: 'A salary rule with this code already exists' },
                { status: 409 }
            );
        }

        const rule = await db.orm.public.SalaryRule.create({
            name: name.trim(),
            code: normalizedCode,
            category: category as SalaryCategory,
            computationMethod: computationMethod as ComputationMethod,
            fixedAmount: fixedAmount !== undefined ? fixedAmount : null,
            percentage: percentage !== undefined ? percentage : null,
            formula: formula !== undefined && formula !== null ? formula.trim() : null,
        });

        return NextResponse.json(rule, { status: 201 });
    } catch {
        return NextResponse.json(
            { error: 'Failed to create salary rule' },
            { status: 500 }
        );
    }
}
