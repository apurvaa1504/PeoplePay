import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import { memoryStore } from "@/lib/memoryStore";
import { checkContractOverlap } from "../route";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (process.env.DATABASE_URL) {
    try {
      const contract = await db.orm.public.Contract.where({ id }).first();
      if (!contract) {
        return NextResponse.json({ error: "Contract not found" }, { status: 404 });
      }

      const emp = await db.orm.public.Employee.where({ id: contract.employeeId }).first();

      return NextResponse.json({
        ...contract,
        employee: emp
          ? {
              id: emp.id,
              firstName: emp.firstName,
              lastName: emp.lastName,
              department: emp.department,
              jobPosition: emp.jobPosition,
            }
          : null,
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: "Database error retrieving contract: " + (err.message || "Unknown error") },
        { status: 500 }
      );
    }
  }

  // MemoryStore fallback
  const contract = memoryStore.contracts.find((c) => c.id === id);
  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const emp = memoryStore.employees.find((e) => e.id === contract.employeeId);
  return NextResponse.json({
    ...contract,
    employee: emp
      ? {
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          department: emp.department,
          jobPosition: emp.jobPosition,
        }
      : null,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { startDate, endDate, wage, department, jobPosition, structureId, status } = body;

    if (process.env.DATABASE_URL) {
      try {
        const existing = await db.orm.public.Contract.where({ id }).first();
        if (!existing) {
          return NextResponse.json({ error: "Contract not found" }, { status: 404 });
        }

        const effectiveStart = startDate || existing.startDate;
        const effectiveEnd = endDate !== undefined ? endDate : existing.endDate;
        const effectiveStatus = status || existing.status;

        if (effectiveEnd && new Date(effectiveEnd).getTime() <= new Date(effectiveStart).getTime()) {
          return NextResponse.json(
            { error: "Contract end date must be strictly after the start date." },
            { status: 400 }
          );
        }

        // Business Rule Check: Overlap validation excluding this contract ID
        if (effectiveStatus === "ACTIVE") {
          const isOverlapping = await checkContractOverlap(
            existing.employeeId,
            effectiveStart,
            effectiveEnd,
            id
          );
          if (isOverlapping) {
            return NextResponse.json(
              {
                error:
                  "Overlapping active contract detected. This employee already has an active contract covering part of this period.",
              },
              { status: 422 }
            );
          }
        }

        // Foreign Key Validation: Structure
        if (structureId) {
          const struct = await db.orm.public.SalaryStructure.where({ id: structureId }).first();
          if (!struct) {
            return NextResponse.json(
              { error: "Invalid structureId: Salary Structure does not exist." },
              { status: 400 }
            );
          }
        }

        const updated = await db.orm.public.Contract.where({ id }).update({
          startDate: effectiveStart,
          endDate: effectiveEnd,
          wage: wage !== undefined ? Number(wage) : existing.wage,
          department: department !== undefined ? department : existing.department,
          jobPosition: jobPosition !== undefined ? jobPosition : existing.jobPosition,
          structureId: structureId !== undefined ? structureId : existing.structureId,
          status: effectiveStatus,
        });

        return NextResponse.json(updated);
      } catch (err: any) {
        return NextResponse.json(
          { error: "Database error updating contract: " + (err.message || "Unknown error") },
          { status: 500 }
        );
      }
    }

    // MemoryStore fallback
    const idx = memoryStore.contracts.findIndex((c) => c.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    const existing = memoryStore.contracts[idx];
    const effectiveStart = startDate || existing.startDate;
    const effectiveEnd = endDate !== undefined ? endDate : existing.endDate;
    const effectiveStatus = status || existing.status;

    if (effectiveStatus === "ACTIVE") {
      const isOverlapping = await checkContractOverlap(
        existing.employeeId,
        effectiveStart,
        effectiveEnd,
        id
      );
      if (isOverlapping) {
        return NextResponse.json(
          {
            error:
              "Overlapping active contract detected. This employee already has an active contract covering part of this period.",
          },
          { status: 422 }
        );
      }
    }

    memoryStore.contracts[idx] = {
      ...existing,
      startDate: effectiveStart,
      endDate: effectiveEnd,
      wage: wage !== undefined ? Number(wage) : existing.wage,
      department: department !== undefined ? department : existing.department,
      jobPosition: jobPosition !== undefined ? jobPosition : existing.jobPosition,
      structureId: structureId !== undefined ? structureId : existing.structureId,
      status: effectiveStatus,
    };

    return NextResponse.json(memoryStore.contracts[idx]);
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid request payload: " + err.message }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (process.env.DATABASE_URL) {
    try {
      const existing = await db.orm.public.Contract.where({ id }).first();
      if (!existing) {
        return NextResponse.json({ error: "Contract not found" }, { status: 404 });
      }

      await db.orm.public.Contract.where({ id }).delete();
      return NextResponse.json({ success: true, message: "Contract deleted successfully." });
    } catch (err: any) {
      return NextResponse.json(
        { error: "Database error deleting contract: " + (err.message || "Unknown error") },
        { status: 500 }
      );
    }
  }

  // MemoryStore fallback
  const idx = memoryStore.contracts.findIndex((c) => c.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  memoryStore.contracts.splice(idx, 1);
  return NextResponse.json({ success: true, message: "Contract deleted successfully." });
}
