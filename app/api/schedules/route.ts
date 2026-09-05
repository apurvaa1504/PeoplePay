import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import { memoryStore } from "@/lib/memoryStore";

export async function GET() {
  try {
    if (process.env.DATABASE_URL) {
      const records = await db.orm.public.WorkingSchedule.all();
      return NextResponse.json(records);
    }
  } catch {
    // Fall back
  }

  const list = memoryStore.schedules.map((s) => {
    const assignedCount = memoryStore.employees.filter((e) => e.scheduleId === s.id).length;
    return {
      ...s,
      assignedEmployeesCount: assignedCount,
    };
  });

  return NextResponse.json(list);
}

// Helper to calculate total weekly hours from schedule lines
export function calculateScheduleHours(lines: { startTime: string; endTime: string; breakMins?: number }[]): number {
  let totalHours = 0;
  for (const line of lines) {
    if (!line.startTime || !line.endTime) continue;
    const [startH, startM] = line.startTime.split(":").map(Number);
    const [endH, endM] = line.endTime.split(":").map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const breakMinutes = line.breakMins || 0;

    const diff = endMinutes - startMinutes - breakMinutes;
    if (diff > 0) {
      totalHours += diff / 60;
    }
  }
  return Math.round(totalHours * 100) / 100;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, lines = [] } = body;

    if (!name) {
      return NextResponse.json({ error: "Schedule name is required" }, { status: 400 });
    }

    // Business Rule: Weekly hours MUST be calculated from schedule lines
    const weeklyHours = calculateScheduleHours(lines);

    try {
      if (process.env.DATABASE_URL) {
        const created = await db.orm.public.WorkingSchedule.create({
          name,
          weeklyHours,
        });
        return NextResponse.json(created, { status: 201 });
      }
    } catch {
      // Fall back
    }

    const scheduleId = `sched-${Date.now()}`;
    const newSchedule = {
      id: scheduleId,
      name,
      weeklyHours,
      lines: lines.map((l: any, idx: number) => ({
        id: `line-${Date.now()}-${idx}`,
        scheduleId,
        day: l.day,
        startTime: l.startTime,
        endTime: l.endTime,
        breakMins: l.breakMins || 0,
      })),
    };

    memoryStore.schedules.unshift(newSchedule);
    return NextResponse.json(newSchedule, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create working schedule" }, { status: 500 });
  }
}
