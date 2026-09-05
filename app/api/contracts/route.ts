import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import { memoryStore } from "@/lib/memoryStore";

// Business Rule: Check for overlapping active contracts for the same employee
function hasActiveContractOverlap(
  employeeId: string,
  startDateStr: string,
  endDateStr: string | null | undefined,
  excludeContractId?: string
): boolean {
  const newStart = new Date(startDateStr).getTime();
  const newEnd = endDateStr ? new Date(endDateStr).getTime() : Infinity;

  const existingActive = memoryStore.contracts.filter(
    (c) =>
      c.employeeId === employeeId &&
      c.status === "ACTIVE" &&
      (!excludeContractId || c.id !== excludeContractId)
  );

  for (const c of existingActive) {
    const existingStart = new Date(c.startDate).getTime();
    const existingEnd = c.endDate ? new Date(c.endDate).getTime() : Infinity;

    // Overlap condition: start1 < end2 AND start2 < end1
    if (newStart < existingEnd && existingStart < newEnd) {
      return true;
    }
  }

  return false;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const status = searchParams.get("status");

  try {
    if (process.env.DATABASE_URL) {
      const records = await db.orm.public.Contract.all();
      let list = records.map((r: any) => ({
        id: r.id,
        employeeId: r.employeeId,
        startDate: r.startDate,
        endDate: r.endDate,
        wage: r.wage,
        department: r.department,
        jobPosition: r.jobPosition,
        structureId: r.structureId,
        status: r.status,
        createdAt: r.createdAt,
      }));
      if (employeeId) list = list.filter((c) => c.employeeId === employeeId);
      if (status) list = list.filter((c) => c.status === status);
      return NextResponse.json(list);
    }
  } catch {
    // Fall back to memoryStore
  }

  let list = [...memoryStore.contracts];
  if (employeeId) list = list.filter((c) => c.employeeId === employeeId);
  if (status) list = list.filter((c) => c.status === status);

  const enriched = list.map((c) => {
    const emp = memoryStore.employees.find((e) => e.id === c.employeeId);
    return {
      ...c,
      employee: emp
        ? {
            id: emp.id,
            firstName: emp.firstName,
            lastName: emp.lastName,
            department: emp.department,
            jobPosition: emp.jobPosition,
          }
        : null,
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      employeeId,
      startDate,
      endDate,
      wage,
      department,
      jobPosition,
      structureId,
      status = "DRAFT",
    } = body;

    if (!employeeId || !startDate || wage === undefined) {
      return NextResponse.json(
        { error: "Employee, start date, and wage are required" },
        { status: 400 }
      );
    }

    // Business Rule Check: Overlap validation if contract is ACTIVE
    if (status === "ACTIVE") {
      const isOverlapping = hasActiveContractOverlap(employeeId, startDate, endDate);
      if (isOverlapping) {
        return NextResponse.json(
          {
            error:
              "Overlapping active contract detected! An employee cannot have multiple active contracts for the same period.",
          },
          { status: 422 }
        );
      }
    }

    try {
      if (process.env.DATABASE_URL) {
        const created = await db.orm.public.Contract.create({
          employeeId,
          startDate,
          endDate: endDate || null,
          wage: Number(wage),
          department: department || null,
          jobPosition: jobPosition || null,
          structureId: structureId || null,
          status,
        });
        return NextResponse.json(created, { status: 201 });
      }
    } catch {
      // Fall back
    }

    const newContract = {
      id: `cont-${Date.now()}`,
      employeeId,
      startDate,
      endDate: endDate || null,
      wage: Number(wage),
      department: department || null,
      jobPosition: jobPosition || null,
      structureId: structureId || null,
      status,
      createdAt: new Date().toISOString(),
    };

    memoryStore.contracts.unshift(newContract);
    return NextResponse.json(newContract, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create contract" }, { status: 500 });
  }
}
