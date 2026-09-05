import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import { memoryStore } from "@/lib/memoryStore";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase() || "";
  const department = searchParams.get("department") || "";
  const status = searchParams.get("status") || "";
  const jobPosition = searchParams.get("jobPosition") || "";
  const userId = searchParams.get("userId") || "";

  if (process.env.DATABASE_URL) {
    try {
      const records = await db.orm.public.Employee.all();
      const allSchedules = await db.orm.public.WorkingSchedule.all();

      let list = records.map((r: any) => {
        const mgr = r.managerId ? records.find((m: any) => m.id === r.managerId) : null;
        const sched = r.scheduleId ? allSchedules.find((s: any) => s.id === r.scheduleId) : null;

        return {
          id: r.id,
          userId: r.userId,
          firstName: r.firstName,
          lastName: r.lastName,
          department: r.department,
          managerId: r.managerId,
          manager: mgr ? { id: mgr.id, firstName: mgr.firstName, lastName: mgr.lastName } : null,
          jobPosition: r.jobPosition,
          status: r.status,
          scheduleId: r.scheduleId,
          schedule: sched ? { id: sched.id, name: sched.name, weeklyHours: sched.weeklyHours } : null,
          createdAt: r.createdAt,
        };
      });

      if (search) {
        list = list.filter(
          (e: any) =>
            e.firstName.toLowerCase().includes(search) ||
            e.lastName.toLowerCase().includes(search) ||
            (e.department && e.department.toLowerCase().includes(search)) ||
            (e.jobPosition && e.jobPosition.toLowerCase().includes(search))
        );
      }
      if (department) {
        list = list.filter((e: any) => e.department === department);
      }
      if (status) {
        list = list.filter((e: any) => e.status === status);
      }
      if (jobPosition) {
        list = list.filter((e: any) => e.jobPosition === jobPosition);
      }
      if (userId) {
        list = list.filter((e: any) => e.userId === userId);
      }

      return NextResponse.json(list);
    } catch (err: any) {
      return NextResponse.json(
        { error: "Database error while fetching employees: " + (err.message || "Unknown error") },
        { status: 500 }
      );
    }
  }

  // MemoryStore demo path only when DATABASE_URL is not configured
  let list = [...memoryStore.employees];
  if (search) {
    list = list.filter(
      (e) =>
        e.firstName.toLowerCase().includes(search) ||
        e.lastName.toLowerCase().includes(search) ||
        (e.department && e.department.toLowerCase().includes(search)) ||
        (e.jobPosition && e.jobPosition.toLowerCase().includes(search))
    );
  }
  if (department) {
    list = list.filter((e) => e.department === department);
  }
  if (status) {
    list = list.filter((e) => e.status === status);
  }
  if (jobPosition) {
    list = list.filter((e) => e.jobPosition === jobPosition);
  }

  const enriched = list.map((e) => {
    const manager = memoryStore.employees.find((m) => m.id === e.managerId);
    const schedule = memoryStore.schedules.find((s) => s.id === e.scheduleId);
    return {
      ...e,
      manager: manager
        ? { id: manager.id, firstName: manager.firstName, lastName: manager.lastName }
        : null,
      schedule: schedule
        ? { id: schedule.id, name: schedule.name, weeklyHours: schedule.weeklyHours }
        : null,
    };
  });

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, department, jobPosition, status = "ACTIVE", managerId, scheduleId } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    if (process.env.DATABASE_URL) {
      try {
        // Foreign key validation: managerId
        if (managerId) {
          const mgr = await db.orm.public.Employee.where({ id: managerId }).first();
          if (!mgr) {
            return NextResponse.json(
              { error: "Invalid managerId: Selected manager does not exist." },
              { status: 400 }
            );
          }
        }

        // Foreign key validation: scheduleId
        if (scheduleId) {
          const sched = await db.orm.public.WorkingSchedule.where({ id: scheduleId }).first();
          if (!sched) {
            return NextResponse.json(
              { error: "Invalid scheduleId: Selected working schedule does not exist." },
              { status: 400 }
            );
          }
        }

        const created = await db.orm.public.Employee.create({
          firstName,
          lastName,
          department: department || null,
          jobPosition: jobPosition || null,
          status,
          managerId: managerId || null,
          scheduleId: scheduleId || null,
        });

        return NextResponse.json(created, { status: 201 });
      } catch (err: any) {
        return NextResponse.json(
          { error: "Failed to create employee in database: " + (err.message || "Unknown error") },
          { status: 500 }
        );
      }
    }

    // MemoryStore fallback only when DATABASE_URL is not set
    if (managerId && !memoryStore.employees.some((m) => m.id === managerId)) {
      return NextResponse.json({ error: "Invalid managerId: Manager not found." }, { status: 400 });
    }
    if (scheduleId && !memoryStore.schedules.some((s) => s.id === scheduleId)) {
      return NextResponse.json({ error: "Invalid scheduleId: Schedule not found." }, { status: 400 });
    }

    const newEmp = {
      id: `emp-${Date.now()}`,
      firstName,
      lastName,
      department: department || null,
      jobPosition: jobPosition || null,
      status,
      managerId: managerId || null,
      scheduleId: scheduleId || null,
      createdAt: new Date().toISOString(),
    };

    memoryStore.employees.unshift(newEmp);
    return NextResponse.json(newEmp, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid request payload: " + err.message }, { status: 400 });
  }
}
