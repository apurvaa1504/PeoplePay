import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/src/prisma/db';
import { requireAuth } from '@/lib/authGuard';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = requireAuth(req, ['HR_MANAGER', 'ADMIN']);
  if (auth.error) return auth.error;

  const { decision } = await req.json();

  if (decision !== 'APPROVED' && decision !== 'REFUSED') {
    return NextResponse.json(
      { error: 'decision must be "APPROVED" or "REFUSED"' },
      { status: 400 }
    );
  }

  try {
    const result = await db.transaction(async (tx) => {
      const request = await tx.orm.public.TimeOffRequest.where({ id: params.id }).first();
      if (!request) {
        throw { status: 404, message: 'Time off request not found' };
      }
      if (request.status !== 'PENDING') {
        throw { status: 409, message: `Request is already ${request.status}, cannot decide again` };
      }

      if (decision === 'REFUSED') {
        const updated = await tx.orm.public.TimeOffRequest.where({ id: params.id }).update({
          status: 'REFUSED',
          decidedBy: auth.user.userId,
          decidedAt: new Date().toISOString(),
        });
        if (!updated) {
          throw { status: 500, message: 'Failed to update request' };
        }
        return { request: updated };
      }

      // decision === 'APPROVED' — find the matching allocation and deduct
      const allocation = await tx.orm.public.Allocation.where({
        employeeId: request.employeeId,
        timeOffTypeId: request.timeOffTypeId,
      }).first();

      if (!allocation) {
        throw { status: 400, message: 'No allocation exists for this employee and leave type' };
      }

      const remaining = allocation.allocated - allocation.taken;
      if (request.duration > remaining) {
        throw {
          status: 400,
          message: `Cannot approve: request duration (${request.duration}) exceeds remaining balance (${remaining})`,
        };
      }

      const updatedAllocation = await tx.orm.public.Allocation.where({ id: allocation.id }).update({
        taken: allocation.taken + request.duration,
      });

      if (!updatedAllocation) {
        throw { status: 500, message: 'Failed to update allocation balance' };
      }

      const updatedRequest = await tx.orm.public.TimeOffRequest.where({ id: params.id }).update({
        status: 'APPROVED',
        decidedBy: auth.user.userId,
        decidedAt: new Date().toISOString(),
      });

      if (!updatedRequest) {
        throw { status: 500, message: 'Failed to update request' };
      }

      return {
        request: updatedRequest,
        allocation: { ...updatedAllocation, remaining: updatedAllocation.allocated - updatedAllocation.taken },
      };
    });

    return NextResponse.json(result);
  } catch (err: any) {
    if (err.status) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    throw err;
  }
}