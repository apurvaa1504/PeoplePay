import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import { memoryStore } from "@/lib/memoryStore";

// Business Rule: Check for overlapping active contracts for the same employee
export async function checkContractOverlap(
  employeeId: string,
  startDateStr: string,
  endDateStr: string | null | undefined,
  excludeContractId?: string
): Promise<boolean> {
  const newStart = new Date(startDateStr).getTime();
  const newEnd = endDateStr ? new Date(endDateStr).getTime() : Infinity;

  let activeContracts: { id: string; employeeId: string; startDate: string; endDate?: string | null; status: string }[] = [];

  if (process.env.DATABASE_URL) {
    const all = await db.orm.public.Contract.all();
    activeContracts = all.filter(
      (c: any) =>
        c.employeeId === employeeId &&
        c.status === "ACTIVE" &&
        (!excludeContractId || c.id !== excludeContractId)
    );
  } else {
    activeContracts = memoryStore.contracts.filter(
      (c) =>
        c.employeeId === employeeId &&
        c.status === "ACTIVE" &&
        (!excludeContractId || c.id !== excludeContractId)
    );
  }

  for (const c of activeContracts) {
    const existingStart = new Date(c.startDate).getTime();
    const existingEnd = c.endDate ? new Date(c.endDate).getTime() : Infinity;

    // Overlap condition: newStart < existingEnd AND existingStart < newEnd
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

  if (process.env.DATABASE_URL) {
    try {
      const records = await db.orm.public.Contract.all();
      const allEmployees = await db.orm.public.Employee.all();

      let list = records.map((r: any) => {
        const emp = allEmployees.find((e: any) => e.id === r.employeeId);
        return {
          id: r.id,
          employeeId: r.employeeId,
          employee: emp
            ? {
                id: emp.id,
                firstName: emp.firstName,
                lastName: emp.lastName,
                department: emp.department,
                jobPosition: emp.jobPosition,
              }
            : null,
          startDate: r.startDate,
          endDate: r.endDate,
          wage: r.wage,
          department: r.department,
          jobPosition: r.jobPosition,
          structureId: r.structureId,
          status: r.status,
          createdAt: r.createdAt,
        };
      });

      if (employeeId) list = list.filter((c: any) => c.employeeId === employeeId);
      if (status) list = list.filter((c: any) => c.status === status);

      return NextResponse.json(list);
    } catch (err: any) {
      return NextResponse.json(
        { error: "Database error fetching contracts: " + (err.message || "Unknown error") },
        { status: 500 }
      );
    }
  }

  // MemoryStore demo path only when DATABASE_URL is not set
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

    if (isNaN(Number(wage)) || Number(wage) < 0) {
      return NextResponse.json({ error: "Wage must be a valid positive number" }, { status: 400 });
    }

    if (endDate && new Date(endDate).getTime() <= new Date(startDate).getTime()) {
      return NextResponse.json(
        { error: "Contract end date must be strictly after the start date." },
        { status: 400 }
      );
    }

    // Business Rule Check: Overlap validation against active contracts in DB
    if (status === "ACTIVE") {
      const isOverlapping = await checkContractOverlap(employeeId, startDate, endDate);
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

    if (process.env.DATABASE_URL) {
      try {
        // Foreign Key Validation: Employee must exist in DB
        const emp = await db.orm.public.Employee.where({ id: employeeId }).first();
        if (!emp) {
          return NextResponse.json(
            { error: "Invalid employeeId: Employee does not exist." },
            { status: 400 }
          );
        }

        // Foreign Key Validation: SalaryStructure if supplied
        if (structureId) {
          const struct = await db.orm.public.SalaryStructure.where({ id: structureId }).first();
          if (!struct) {
            return NextResponse.json(
              { error: "Invalid structureId: Salary Structure does not exist." },
              { status: 400 }
            );
          }
        }

        const created = await db.orm.public.Contract.create({
          employeeId,
          startDate,
          endDate: endDate || null,
          wage: Number(wage),
          department: department || emp.department || null,
          jobPosition: jobPosition || emp.jobPosition || null,
          structureId: structureId || null,
          status,
        });

        return NextResponse.json(created, { status: 201 });
      } catch (err: any) {
        return NextResponse.json(
          { error: "Failed to create contract in database: " + (err.message || "Unknown error") },
          { status: 500 }
        );
      }
    }

    // MemoryStore fallback only when DATABASE_URL is not set
    const emp = memoryStore.employees.find((e) => e.id === employeeId);
    if (!emp) {
      return NextResponse.json({ error: "Invalid employeeId: Employee does not exist." }, { status: 400 });
    }

    const newContract = {
      id: `cont-${Date.now()}`,
      employeeId,
      startDate,
      endDate: endDate || null,
      wage: Number(wage),
      department: department || emp.department || null,
      jobPosition: jobPosition || emp.jobPosition || null,
      structureId: structureId || null,
      status,
      createdAt: new Date().toISOString(),
    };

    memoryStore.contracts.unshift(newContract);
    return NextResponse.json(newContract, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid request payload: " + err.message }, { status: 400 });
  }
}
