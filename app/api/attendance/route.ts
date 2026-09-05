import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import { memoryStore } from "@/lib/memoryStore";
import { requireAuth } from "@/lib/authGuard";

export function computeWorkedHours(checkIn: string, checkOut?: string | null): number | null {
  if (!checkIn || !checkOut) return null;
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return 0;
  const hours = (end - start) / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const status = searchParams.get("status");

  if (process.env.DATABASE_URL) {
    try {
      const records = await db.orm.public.Attendance.all();
      const allEmployees = await db.orm.public.Employee.all();

      let list = records.map((r: any) => {
        const emp = allEmployees.find((e: any) => e.id === r.employeeId);
        return {
          id: r.id,
          employeeId: r.employeeId,
          employee: emp
            ? { id: emp.id, firstName: emp.firstName, lastName: emp.lastName, department: emp.department }
            : null,
          checkIn: r.checkIn,
          checkOut: r.checkOut,
          workedHours: r.workedHours,
          status: r.status,
          correctedBy: r.correctedBy,
          correctedAt: r.correctedAt,
        };
      });

      if (employeeId) list = list.filter((a: any) => a.employeeId === employeeId);
      if (status) list = list.filter((a: any) => a.status === status);

      return NextResponse.json(list);
    } catch (err: any) {
      return NextResponse.json(
        { error: "Database error fetching attendance: " + (err.message || "Unknown error") },
        { status: 500 }
      );
    }
  }

  // MemoryStore demo path only when DATABASE_URL is not set
  let list = [...memoryStore.attendances];
  if (employeeId) list = list.filter((a) => a.employeeId === employeeId);
  if (status) list = list.filter((a) => a.status === status);

  const enriched = list.map((a) => {
    const emp = memoryStore.employees.find((e) => e.id === a.employeeId);
    return {
      ...a,
      employee: emp
        ? { id: emp.id, firstName: emp.firstName, lastName: emp.lastName, department: emp.department }
        : null,
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeeId, checkIn, checkOut, status = "PRESENT" } = body;

    if (!employeeId || !checkIn) {
      return NextResponse.json(
        { error: "Employee and Check In time are required" },
        { status: 400 }
      );
    }

    if (checkOut && new Date(checkOut).getTime() <= new Date(checkIn).getTime()) {
      return NextResponse.json(
        { error: "Check Out time must be strictly after Check In time." },
        { status: 400 }
      );
    }

    // Business Rule: workedHours calculated strictly on server
    const workedHours = computeWorkedHours(checkIn, checkOut);

    if (process.env.DATABASE_URL) {
      try {
        const emp = await db.orm.public.Employee.where({ id: employeeId }).first();
        if (!emp) {
          return NextResponse.json(
            { error: "Invalid employeeId: Employee does not exist." },
            { status: 400 }
          );
        }

        const created = await db.orm.public.Attendance.create({
          employeeId,
          checkIn,
          checkOut: checkOut || null,
          workedHours,
          status,
        });

        return NextResponse.json(created, { status: 201 });
      } catch (err: any) {
        return NextResponse.json(
          { error: "Failed to record attendance in database: " + (err.message || "Unknown error") },
          { status: 500 }
        );
      }
    }

    // MemoryStore fallback only when DATABASE_URL is not set
    const emp = memoryStore.employees.find((e) => e.id === employeeId);
    if (!emp) {
      return NextResponse.json({ error: "Invalid employeeId: Employee does not exist." }, { status: 400 });
    }

    const newAttendance = {
      id: `att-${Date.now()}`,
      employeeId,
      checkIn,
      checkOut: checkOut || null,
      workedHours,
      status,
      correctedBy: null,
      correctedAt: null,
    };

    memoryStore.attendances.unshift(newAttendance);
    return NextResponse.json(newAttendance, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid request payload: " + err.message }, { status: 400 });
  }
}

// Security: Strict manual attendance correction endpoint with requireAuth()
export async function PATCH(req: NextRequest) {
  try {
    // 1. Strict JWT Authentication & Authorization check
    // Only HR_MANAGER, HR_PAYROLL_MANAGER, and ADMIN can manually correct attendance
    const authResult = requireAuth(req, ["HR_MANAGER", "HR_PAYROLL_MANAGER", "ADMIN"]);
    if (authResult.error) {
      return authResult.error;
    }

    const authUser = authResult.user!;
    const body = await req.json();
    const { id, checkIn, checkOut, status = "MANUAL_CORRECTION" } = body;

    if (!id) {
      return NextResponse.json({ error: "Attendance record ID is required" }, { status: 400 });
    }

    if (checkIn && checkOut && new Date(checkOut).getTime() <= new Date(checkIn).getTime()) {
      return NextResponse.json(
        { error: "Check Out time must be strictly after Check In time." },
        { status: 400 }
      );
    }

    const calculatedHours = computeWorkedHours(checkIn, checkOut);
    const correctedBy = authUser.userId;
    const correctedAt = new Date().toISOString();

    if (process.env.DATABASE_URL) {
      try {
        const existing = await db.orm.public.Attendance.where({ id }).first();
        if (!existing) {
          return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
        }

        const effectiveCheckIn = checkIn || existing.checkIn;
        const effectiveCheckOut = checkOut !== undefined ? checkOut : existing.checkOut;
        const finalHours = computeWorkedHours(effectiveCheckIn, effectiveCheckOut);

        const updated = await db.orm.public.Attendance.where({ id }).update({
          checkIn: effectiveCheckIn,
          checkOut: effectiveCheckOut || null,
          workedHours: finalHours,
          status,
          correctedBy,
          correctedAt,
        });

        return NextResponse.json(updated);
      } catch (err: any) {
        return NextResponse.json(
          { error: "Database error updating attendance: " + (err.message || "Unknown error") },
          { status: 500 }
        );
      }
    }

    // MemoryStore fallback only when DATABASE_URL is not set
    const idx = memoryStore.attendances.findIndex((a) => a.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    const existing = memoryStore.attendances[idx];
    const effectiveCheckIn = checkIn || existing.checkIn;
    const effectiveCheckOut = checkOut !== undefined ? checkOut : existing.checkOut;
    const finalHours = computeWorkedHours(effectiveCheckIn, effectiveCheckOut);

    memoryStore.attendances[idx] = {
      ...existing,
      checkIn: effectiveCheckIn,
      checkOut: effectiveCheckOut || null,
      workedHours: finalHours,
      status,
      correctedBy,
      correctedAt,
    };

    return NextResponse.json(memoryStore.attendances[idx]);
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid request payload: " + err.message }, { status: 400 });
  }
}
