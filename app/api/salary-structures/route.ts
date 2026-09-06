import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { requireAuth } from '@/lib/authGuard';

export async function GET(req: NextRequest) {
    const auth = requireAuth(req, [
        'HR_MANAGER',
        'HR_PAYROLL_USER',
        'HR_PAYROLL_MANAGER',
        'ADMIN',
    ]);

    if ('error' in auth) {
        return auth.error;
    }

    const structures = await db.orm.public.SalaryStructure
        .select('id', 'name', 'active')
        .all();

    return NextResponse.json(structures);
}

export async function POST(req: NextRequest) {
    const auth = requireAuth(req, [
        'HR_PAYROLL_MANAGER',
        'ADMIN',
    ]);

    if ('error' in auth) {
        return auth.error;
    }

    const body = await req.json();
    const { name, active } = body;

    if (!name || typeof name !== 'string') {
        return NextResponse.json(
            { error: 'Name is required' },
            { status: 400 }
        );
    }

    const structure = await db.orm.public.SalaryStructure.create({
        name,
        active: active ?? true,
    });

    return NextResponse.json(structure, { status: 201 });
}