import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import { memoryStore } from "@/lib/memoryStore";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (process.env.DATABASE_URL) {
    try {
      const attendance = await db.orm.public.Attendance.where({ id }).first();
      if (!attendance) {
        return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
      }

      const emp = await db.orm.public.Employee.where({ id: attendance.employeeId }).first();

      return NextResponse.json({
        ...attendance,
        employee: emp
          ? {
              id: emp.id,
              firstName: emp.firstName,
              lastName: emp.lastName,
              department: emp.department,
            }
          : null,
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: "Database error retrieving attendance: " + (err.message || "Unknown error") },
        { status: 500 }
      );
    }
  }

  // MemoryStore fallback
  const attendance = memoryStore.attendances.find((a) => a.id === id);
  if (!attendance) {
    return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
  }

  const emp = memoryStore.employees.find((e) => e.id === attendance.employeeId);
  return NextResponse.json({
    ...attendance,
    employee: emp
      ? {
          id: emp.id,
          firstName: emp.firstName,
          lastName: emp.lastName,
          department: emp.department,
        }
      : null,
  });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (process.env.DATABASE_URL) {
    try {
      const existing = await db.orm.public.Attendance.where({ id }).first();
      if (!existing) {
        return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
      }

      await db.orm.public.Attendance.where({ id }).delete();
      return NextResponse.json({ success: true, message: "Attendance record deleted successfully." });
    } catch (err: any) {
      return NextResponse.json(
        { error: "Database error deleting attendance: " + (err.message || "Unknown error") },
        { status: 500 }
      );
    }
  }

  // MemoryStore fallback
  const idx = memoryStore.attendances.findIndex((a) => a.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Attendance record not found" }, { status: 404 });
  }

  memoryStore.attendances.splice(idx, 1);
  return NextResponse.json({ success: true, message: "Attendance record deleted successfully." });
}
