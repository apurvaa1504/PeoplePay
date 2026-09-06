import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import { memoryStore } from "@/lib/memoryStore";
import { computeWorkedHours } from "@/app/api/attendance/route";
import { requireAuth } from "@/lib/authGuard";

export async function POST(req: NextRequest) {
  try {
    const authResult = requireAuth(req, [
      "EMPLOYEE",
      "HR_MANAGER",
      "HR_PAYROLL_USER",
      "HR_PAYROLL_MANAGER",
      "ADMIN",
    ]);
    if (authResult.error) {
      return authResult.error;
    }

    const authUser = authResult.user!;
    const body = await req.json().catch(() => ({}));
    let { employeeId, action } = body; // action: 'check-in' | 'check-out'

    // If employeeId wasn't passed or user is EMPLOYEE, look up the employee record from userId or employeeId
    if (!employeeId) {
      if (process.env.DATABASE_URL) {
        const emp = await db.orm.public.Employee.where({ userId: authUser.userId }).first();
        if (emp) employeeId = emp.id;
      } else {
        const emp = memoryStore.employees.find((e) => e.userId === authUser.userId);
        if (emp) employeeId = emp.id;
      }
    }

    if (!employeeId) {
      return NextResponse.json({ error: "Employee profile or ID is required." }, { status: 400 });
    }

    const now = new Date();
    const nowIso = now.toISOString();

    if (process.env.DATABASE_URL) {
      try {
        const emp = await db.orm.public.Employee.where({ id: employeeId }).first();
        if (!emp) {
          return NextResponse.json({ error: "Employee not found." }, { status: 404 });
        }

        // Find the latest attendance record for this employee
        const records = await db.orm.public.Attendance.where({ employeeId }).all();
        // Sort descending by checkIn
        records.sort((a: any, b: any) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
        const latestRecord = records[0];

        // If action is explicit check-out or toggle checkout
        const isCurrentlyCheckedIn = latestRecord && !latestRecord.checkOut;

        if (action === "check-out" || (!action && isCurrentlyCheckedIn)) {
          if (!isCurrentlyCheckedIn) {
            return NextResponse.json(
              { error: "You are not currently checked in. Please check in first." },
              { status: 400 }
            );
          }

          const workedHours = computeWorkedHours(latestRecord.checkIn, nowIso);
          const updated = await db.orm.public.Attendance.where({ id: latestRecord.id }).update({
            checkOut: nowIso,
            workedHours,
          });

          return NextResponse.json({
            action: "check-out",
            message: "Checked out successfully.",
            record: updated,
            workedHours,
          });
        }

        // Check-in
        if (action === "check-in" || (!action && !isCurrentlyCheckedIn)) {
          if (isCurrentlyCheckedIn) {
            return NextResponse.json(
              { error: "You are already checked in. Please check out before checking in again." },
              { status: 400 }
            );
          }

          const created = await db.orm.public.Attendance.create({
            employeeId,
            checkIn: nowIso,
            checkOut: null,
            workedHours: null,
            status: "PRESENT",
          });

          return NextResponse.json({
            action: "check-in",
            message: "Checked in successfully.",
            record: created,
          }, { status: 201 });
        }

        return NextResponse.json({ error: "Invalid action." }, { status: 400 });
      } catch (err: any) {
        return NextResponse.json(
          { error: "Database error during punch: " + (err.message || "Unknown error") },
          { status: 500 }
        );
      }
    }

    // MemoryStore fallback
    const records = memoryStore.attendances.filter((a) => a.employeeId === employeeId);
    records.sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());
    const latestRecord = records[0];
    const isCurrentlyCheckedIn = latestRecord && !latestRecord.checkOut;

    if (action === "check-out" || (!action && isCurrentlyCheckedIn)) {
      if (!isCurrentlyCheckedIn) {
        return NextResponse.json(
          { error: "You are not currently checked in. Please check in first." },
          { status: 400 }
        );
      }

      const workedHours = computeWorkedHours(latestRecord.checkIn, nowIso);
      latestRecord.checkOut = nowIso;
      latestRecord.workedHours = workedHours;

      return NextResponse.json({
        action: "check-out",
        message: "Checked out successfully.",
        record: latestRecord,
        workedHours,
      });
    }

    // Check-in
    const newRecord: any = {
      id: `att-${Date.now()}`,
      employeeId,
      checkIn: nowIso,
      checkOut: null,
      workedHours: null,
      status: "PRESENT" as const,
      correctedBy: null,
      correctedAt: null,
    };
    memoryStore.attendances.unshift(newRecord);

    return NextResponse.json({
      action: "check-in",
      message: "Checked in successfully.",
      record: newRecord,
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Internal error: " + err.message }, { status: 500 });
  }
}
