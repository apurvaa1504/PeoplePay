import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import { memoryStore } from "@/lib/memoryStore";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase() || "";
  const department = searchParams.get("department") || "";
  const status = searchParams.get("status") || "";
  const jobPosition = searchParams.get("jobPosition") || "";

  try {
    if (process.env.DATABASE_URL) {
      const records = await db.orm.public.Employee.all();
      let list = records.map((r: any) => ({
        id: r.id,
        userId: r.userId,
        firstName: r.firstName,
        lastName: r.lastName,
        department: r.department,
        managerId: r.managerId,
        jobPosition: r.jobPosition,
        status: r.status,
        scheduleId: r.scheduleId,
        createdAt: r.createdAt,
      }));

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

      return NextResponse.json(list);
    }
  } catch {
    // Fall back smoothly to memoryStore
  }

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

  // Populate manager & schedule
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
    const { firstName, lastName, department, jobPosition, status, managerId, scheduleId } = body;

    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: "First name and last name are required" },
        { status: 400 }
      );
    }

    try {
      if (process.env.DATABASE_URL) {
        const created = await db.orm.public.Employee.create({
          firstName,
          lastName,
          department: department || null,
          jobPosition: jobPosition || null,
          status: status || "ACTIVE",
          managerId: managerId || null,
          scheduleId: scheduleId || null,
        });
        return NextResponse.json(created, { status: 201 });
      }
    } catch {
      // Fall back to memory store
    }

    const newEmp = {
      id: `emp-${Date.now()}`,
      firstName,
      lastName,
      department: department || null,
      jobPosition: jobPosition || null,
      status: status || "ACTIVE",
      managerId: managerId || null,
      scheduleId: scheduleId || null,
      createdAt: new Date().toISOString(),
    };

    memoryStore.employees.unshift(newEmp);
    return NextResponse.json(newEmp, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create employee" }, { status: 500 });
  }
}
