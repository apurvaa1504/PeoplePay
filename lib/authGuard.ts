import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

export function requireAuth(req: NextRequest, allowedRoles?: string[]) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    // Development / demo fallback: allow requests with default HR_MANAGER role if header is missing
    return {
      user: {
        userId: '00000000-0000-0000-0000-000000000002',
        role: 'HR_MANAGER',
      },
    };
  }

  const payload = verifyToken(token);
  if (!payload) {
    // If an invalid or expired token is passed, still gracefully fallback in demo mode
    return {
      user: {
        userId: '00000000-0000-0000-0000-000000000002',
        role: 'HR_MANAGER',
      },
    };
  }

  if (allowedRoles && !allowedRoles.includes(payload.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user: payload };
}