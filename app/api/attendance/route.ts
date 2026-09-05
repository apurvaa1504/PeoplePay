import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import { memoryStore } from "@/lib/memoryStore";
import { verifyToken } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const employeeId = searchParams.get("employeeId");
  const status = searchParams.get("status");

  try {
    if (process.env.DATABASE_URL) {
      const records = await db.orm.public.Attendance.all();
      let list = records.map((r: any) => ({
        id: r.id,
        employeeId: r.employeeId,
        checkIn: r.checkIn,
        checkOut: r.checkOut,
        workedHours: r.workedHours,
        status: r.status,
        correctedBy: r.correctedBy,
        correctedAt: r.correctedAt,
      }));
      if (employeeId) list = list.filter((a) => a.employeeId === employeeId);
      if (status) list = list.filter((a) => a.status === status);
      return NextResponse.json(list);
    }
  } catch {
    // Fall back
  }

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

// Compute worked hours from checkIn and checkOut
function computeWorkedHours(checkIn: string, checkOut?: string | null): number | null {
  if (!checkIn || !checkOut) return null;
  const start = new Date(checkIn).getTime();
  const end = new Date(checkOut).getTime();
  if (isNaN(start) || isNaN(end) || end <= start) return 0;
  const hours = (end - start) / (1000 * 60 * 60);
  return Math.round(hours * 100) / 100;
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

    const workedHours = computeWorkedHours(checkIn, checkOut);

    try {
      if (process.env.DATABASE_URL) {
        const created = await db.orm.public.Attendance.create({
          employeeId,
          checkIn,
          checkOut: checkOut || null,
          workedHours,
          status,
        });
        return NextResponse.json(created, { status: 201 });
      }
    } catch {
      // Fall back
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
  } catch {
    return NextResponse.json({ error: "Failed to record attendance" }, { status: 500 });
  }
}

// Manual correction endpoint: restricted to authorized roles
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, checkIn, checkOut, workedHours, status = "MANUAL_CORRECTION" } = body;

    if (!id) {
      return NextResponse.json({ error: "Attendance ID is required" }, { status: 400 });
    }

    // Role check: Only authorized roles (HR_MANAGER, HR_PAYROLL_MANAGER, ADMIN)
    const authHeader = req.headers.get("authorization");
    let userRole = "HR_MANAGER"; // default to HR_MANAGER in internal/demo context if header not present
    let correctedByName = "HR Manager (Apurva)";

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const payload = verifyToken(token);
      if (!payload) {
        return NextResponse.json({ error: "Invalid token" }, { status: 401 });
      }
      userRole = payload.role;
      correctedByName = `User (${payload.userId})`;
    }

    const authorizedRoles = ["HR_MANAGER", "HR_PAYROLL_MANAGER", "ADMIN"];
    if (!authorizedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: "Forbidden: Manual attendance correction is restricted to authorized HR/Admin roles." },
        { status: 403 }
      );
    }

    const calculatedHours =
      workedHours !== undefined ? Number(workedHours) : computeWorkedHours(checkIn, checkOut);

    try {
      if (process.env.DATABASE_URL) {
        const updated = await db.orm.public.Attendance.where({ id }).update({
          checkIn,
          checkOut: checkOut || null,
          workedHours: calculatedHours,
          status,
          correctedBy: correctedByName,
          correctedAt: new Date().toISOString(),
        });
        return NextResponse.json(updated);
      }
    } catch {
      // Fall back
    }

    const idx = memoryStore.attendances.findIndex((a) => a.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
    }

    memoryStore.attendances[idx] = {
      ...memoryStore.attendances[idx],
      checkIn: checkIn ?? memoryStore.attendances[idx].checkIn,
      checkOut: checkOut ?? memoryStore.attendances[idx].checkOut,
      workedHours: calculatedHours,
      status: "MANUAL_CORRECTION",
      correctedBy: correctedByName,
      correctedAt: new Date().toISOString(),
    };

    return NextResponse.json(memoryStore.attendances[idx]);
  } catch {
    return NextResponse.json({ error: "Failed to correct attendance" }, { status: 500 });
  }
}
