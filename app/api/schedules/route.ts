import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import { memoryStore } from "@/lib/memoryStore";

// Server-side calculation of weekly hours strictly from schedule lines
export function calculateScheduleHours(lines: { startTime: string; endTime: string; breakMins?: number }[]): number {
  let totalHours = 0;
  for (const line of lines) {
    if (!line.startTime || !line.endTime) continue;
    const [startH, startM] = line.startTime.split(":").map(Number);
    const [endH, endM] = line.endTime.split(":").map(Number);

    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const breakMinutes = Number(line.breakMins) || 0;

    const diff = endMinutes - startMinutes - breakMinutes;
    if (diff > 0) {
      totalHours += diff / 60;
    }
  }
  return Math.round(totalHours * 100) / 100;
}

export async function GET() {
  if (process.env.DATABASE_URL) {
    try {
      const records = await db.orm.public.WorkingSchedule.all();
      const allLines = await db.orm.public.ScheduleLine.all();
      const allEmployees = await db.orm.public.Employee.all();

      const list = records.map((s: any) => {
        const lines = allLines.filter((l: any) => l.scheduleId === s.id);
        const assignedEmployeesCount = allEmployees.filter((e: any) => e.scheduleId === s.id).length;
        return {
          id: s.id,
          name: s.name,
          weeklyHours: s.weeklyHours,
          lines,
          assignedEmployeesCount,
        };
      });

      return NextResponse.json(list);
    } catch (err: any) {
      return NextResponse.json(
        { error: "Database error fetching schedules: " + (err.message || "Unknown error") },
        { status: 500 }
      );
    }
  }

  // MemoryStore demo path only when DATABASE_URL is not set
  const list = memoryStore.schedules.map((s) => {
    const assignedCount = memoryStore.employees.filter((e) => e.scheduleId === s.id).length;
    return {
      ...s,
      assignedEmployeesCount: assignedCount,
    };
  });

  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, lines = [] } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Schedule name is required" }, { status: 400 });
    }

    // Business Rule: Server calculates weeklyHours from lines - client value ignored
    const weeklyHours = calculateScheduleHours(lines);

    if (process.env.DATABASE_URL) {
      try {
        const createdSchedule = await db.orm.public.WorkingSchedule.create({
          name: name.trim(),
          weeklyHours,
        });

        const createdLines = [];
        for (const l of lines) {
          if (l.day && l.startTime && l.endTime) {
            const lineRec = await db.orm.public.ScheduleLine.create({
              scheduleId: createdSchedule.id,
              day: l.day,
              startTime: l.startTime,
              endTime: l.endTime,
              breakMins: Number(l.breakMins) || 0,
            });
            createdLines.push(lineRec);
          }
        }

        return NextResponse.json({
          ...createdSchedule,
          lines: createdLines,
        }, { status: 201 });
      } catch (err: any) {
        return NextResponse.json(
          { error: "Failed to create working schedule in database: " + (err.message || "Unknown error") },
          { status: 500 }
        );
      }
    }

    // MemoryStore fallback only when DATABASE_URL is not set
    const scheduleId = `sched-${Date.now()}`;
    const newSchedule = {
      id: scheduleId,
      name: name.trim(),
      weeklyHours,
      lines: lines.map((l: any, idx: number) => ({
        id: `line-${Date.now()}-${idx}`,
        scheduleId,
        day: l.day,
        startTime: l.startTime,
        endTime: l.endTime,
        breakMins: Number(l.breakMins) || 0,
      })),
    };

    memoryStore.schedules.unshift(newSchedule);
    return NextResponse.json(newSchedule, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: "Invalid request payload: " + err.message }, { status: 400 });
  }
}
