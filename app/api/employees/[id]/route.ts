import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import { memoryStore } from "@/lib/memoryStore";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    if (process.env.DATABASE_URL) {
      const emp = await db.orm.public.Employee.where({ id }).first();
      if (emp) return NextResponse.json(emp);
    }
  } catch {
    // Fall back to memoryStore
  }

  const emp = memoryStore.employees.find((e) => e.id === id);
  if (!emp) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const manager = memoryStore.employees.find((m) => m.id === emp.managerId);
  const schedule = memoryStore.schedules.find((s) => s.id === emp.scheduleId);
  const contracts = memoryStore.contracts.filter((c) => c.employeeId === id);
  const attendances = memoryStore.attendances.filter((a) => a.employeeId === id);

  return NextResponse.json({
    ...emp,
    manager: manager
      ? { id: manager.id, firstName: manager.firstName, lastName: manager.lastName }
      : null,
    schedule: schedule
      ? { id: schedule.id, name: schedule.name, weeklyHours: schedule.weeklyHours }
      : null,
    contractsCount: contracts.length,
    attendanceCount: attendances.length,
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { firstName, lastName, department, jobPosition, status, managerId, scheduleId } = body;

    try {
      if (process.env.DATABASE_URL) {
        const updated = await db.orm.public.Employee.where({ id }).update({
          firstName,
          lastName,
          department: department || null,
          jobPosition: jobPosition || null,
          status: status || "ACTIVE",
          managerId: managerId || null,
          scheduleId: scheduleId || null,
        });
        return NextResponse.json(updated);
      }
    } catch {
      // Fall back
    }

    const idx = memoryStore.employees.findIndex((e) => e.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    memoryStore.employees[idx] = {
      ...memoryStore.employees[idx],
      firstName: firstName ?? memoryStore.employees[idx].firstName,
      lastName: lastName ?? memoryStore.employees[idx].lastName,
      department: department !== undefined ? department : memoryStore.employees[idx].department,
      jobPosition: jobPosition !== undefined ? jobPosition : memoryStore.employees[idx].jobPosition,
      status: status ?? memoryStore.employees[idx].status,
      managerId: managerId !== undefined ? managerId : memoryStore.employees[idx].managerId,
      scheduleId: scheduleId !== undefined ? scheduleId : memoryStore.employees[idx].scheduleId,
    };

    return NextResponse.json(memoryStore.employees[idx]);
  } catch {
    return NextResponse.json({ error: "Failed to update employee" }, { status: 500 });
  }
}
