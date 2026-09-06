import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';

export function requireAuth(req: NextRequest, allowedRoles?: string[]) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return { error: NextResponse.json({ error: 'Missing token' }, { status: 401 }) };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { error: NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 }) };
  }

  if (allowedRoles && !allowedRoles.includes(payload.role)) {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { user: payload };
}