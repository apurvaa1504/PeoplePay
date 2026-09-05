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
      const emp = await db.orm.public.Employee.where({ id }).first();
      if (!emp) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }

      let manager = null;
      if (emp.managerId) {
        const mgr = await db.orm.public.Employee.where({ id: emp.managerId }).first();
        if (mgr) {
          manager = { id: mgr.id, firstName: mgr.firstName, lastName: mgr.lastName };
        }
      }

      let schedule = null;
      if (emp.scheduleId) {
        const sched = await db.orm.public.WorkingSchedule.where({ id: emp.scheduleId }).first();
        if (sched) {
          schedule = { id: sched.id, name: sched.name, weeklyHours: sched.weeklyHours };
        }
      }

      const allContracts = await db.orm.public.Contract.all();
      const contractsCount = allContracts.filter((c: any) => c.employeeId === id).length;

      const allAttendances = await db.orm.public.Attendance.all();
      const attendanceCount = allAttendances.filter((a: any) => a.employeeId === id).length;

      return NextResponse.json({
        ...emp,
        manager,
        schedule,
        contractsCount,
        attendanceCount,
      });
    } catch (err: any) {
      return NextResponse.json(
        { error: "Database error retrieving employee: " + (err.message || "Unknown error") },
        { status: 500 }
      );
    }
  }

  // MemoryStore demo path only when DATABASE_URL is not set
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

    if (process.env.DATABASE_URL) {
      try {
        const existing = await db.orm.public.Employee.where({ id }).first();
        if (!existing) {
          return NextResponse.json({ error: "Employee not found" }, { status: 404 });
        }

        if (managerId) {
          if (managerId === id) {
            return NextResponse.json(
              { error: "An employee cannot be their own manager." },
              { status: 400 }
            );
          }
          const mgr = await db.orm.public.Employee.where({ id: managerId }).first();
          if (!mgr) {
            return NextResponse.json(
              { error: "Invalid managerId: Selected manager does not exist." },
              { status: 400 }
            );
          }
        }

        if (scheduleId) {
          const sched = await db.orm.public.WorkingSchedule.where({ id: scheduleId }).first();
          if (!sched) {
            return NextResponse.json(
              { error: "Invalid scheduleId: Selected working schedule does not exist." },
              { status: 400 }
            );
          }
        }

        const updated = await db.orm.public.Employee.where({ id }).update({
          firstName: firstName !== undefined ? firstName : existing.firstName,
          lastName: lastName !== undefined ? lastName : existing.lastName,
          department: department !== undefined ? department : existing.department,
          jobPosition: jobPosition !== undefined ? jobPosition : existing.jobPosition,
          status: status !== undefined ? status : existing.status,
          managerId: managerId !== undefined ? managerId : existing.managerId,
          scheduleId: scheduleId !== undefined ? scheduleId : existing.scheduleId,
        });

        return NextResponse.json(updated);
      } catch (err: any) {
        return NextResponse.json(
          { error: "Database error updating employee: " + (err.message || "Unknown error") },
          { status: 500 }
        );
      }
    }

    // MemoryStore fallback only when DATABASE_URL is not set
    const idx = memoryStore.employees.findIndex((e) => e.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 });
    }

    if (managerId && managerId === id) {
      return NextResponse.json({ error: "An employee cannot be their own manager." }, { status: 400 });
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
      const existing = await db.orm.public.Employee.where({ id }).first();
      if (!existing) {
        return NextResponse.json({ error: "Employee not found" }, { status: 404 });
      }

      // Safe deletion strategy: Check relational dependencies before attempting deletion
      const allContracts = await db.orm.public.Contract.all();
      const hasContracts = allContracts.some((c: any) => c.employeeId === id);
      if (hasContracts) {
        return NextResponse.json(
          { error: "Cannot delete employee: Existing employment contracts are associated with this employee." },
          { status: 409 }
        );
      }

      const allAttendances = await db.orm.public.Attendance.all();
      const hasAttendance = allAttendances.some((a: any) => a.employeeId === id);
      if (hasAttendance) {
        return NextResponse.json(
          { error: "Cannot delete employee: Attendance history exists for this employee." },
          { status: 409 }
        );
      }

      const allEmps = await db.orm.public.Employee.all();
      const hasReports = allEmps.some((e: any) => e.managerId === id);
      if (hasReports) {
        return NextResponse.json(
          { error: "Cannot delete employee: Other employees report to this manager. Reassign reports first." },
          { status: 409 }
        );
      }

      await db.orm.public.Employee.where({ id }).delete();
      return NextResponse.json({ success: true, message: "Employee deleted successfully." });
    } catch (err: any) {
      return NextResponse.json(
        { error: "Database error deleting employee: " + (err.message || "Unknown error") },
        { status: 500 }
      );
    }
  }

  // MemoryStore fallback only when DATABASE_URL is not set
  const idx = memoryStore.employees.findIndex((e) => e.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const hasContracts = memoryStore.contracts.some((c) => c.employeeId === id);
  if (hasContracts) {
    return NextResponse.json(
      { error: "Cannot delete employee: Existing employment contracts are associated with this employee." },
      { status: 409 }
    );
  }

  memoryStore.employees.splice(idx, 1);
  return NextResponse.json({ success: true, message: "Employee deleted successfully." });
}
