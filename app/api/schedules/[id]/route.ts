import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/prisma/db";
import { memoryStore } from "@/lib/memoryStore";
import { calculateScheduleHours } from "../route";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (process.env.DATABASE_URL) {
    try {
      const schedule = await db.orm.public.WorkingSchedule.where({ id }).first();
      if (!schedule) {
        return NextResponse.json({ error: "Working schedule not found" }, { status: 404 });
      }

      const allLines = await db.orm.public.ScheduleLine.all();
      const lines = allLines.filter((l: any) => l.scheduleId === id);

      return NextResponse.json({ ...schedule, lines });
    } catch (err: any) {
      return NextResponse.json(
        { error: "Database error retrieving schedule: " + (err.message || "Unknown error") },
        { status: 500 }
      );
    }
  }

  // MemoryStore fallback
  const schedule = memoryStore.schedules.find((s) => s.id === id);
  if (!schedule) {
    return NextResponse.json({ error: "Working schedule not found" }, { status: 404 });
  }

  return NextResponse.json(schedule);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await req.json();
    const { name, lines } = body;

    if (process.env.DATABASE_URL) {
      try {
        const existing = await db.orm.public.WorkingSchedule.where({ id }).first();
        if (!existing) {
          return NextResponse.json({ error: "Working schedule not found" }, { status: 404 });
        }

        let weeklyHours = existing.weeklyHours;

        if (Array.isArray(lines)) {
          weeklyHours = calculateScheduleHours(lines);

          // Delete existing lines
          const allLines = await db.orm.public.ScheduleLine.all();
          const oldLines = allLines.filter((l: any) => l.scheduleId === id);
          for (const ol of oldLines) {
            await db.orm.public.ScheduleLine.where({ id: ol.id }).delete();
          }

          // Create new lines
          for (const nl of lines) {
            if (nl.day && nl.startTime && nl.endTime) {
              await db.orm.public.ScheduleLine.create({
                scheduleId: id,
                day: nl.day,
                startTime: nl.startTime,
                endTime: nl.endTime,
                breakMins: Number(nl.breakMins) || 0,
              });
            }
          }
        }

        const updated = await db.orm.public.WorkingSchedule.where({ id }).update({
          name: name ? name.trim() : existing.name,
          weeklyHours,
        });

        return NextResponse.json(updated);
      } catch (err: any) {
        return NextResponse.json(
          { error: "Database error updating schedule: " + (err.message || "Unknown error") },
          { status: 500 }
        );
      }
    }

    // MemoryStore fallback
    const idx = memoryStore.schedules.findIndex((s) => s.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Working schedule not found" }, { status: 404 });
    }

    const existing = memoryStore.schedules[idx];
    let weeklyHours = existing.weeklyHours;
    let updatedLines = existing.lines;

    if (Array.isArray(lines)) {
      weeklyHours = calculateScheduleHours(lines);
      updatedLines = lines.map((l: any, i: number) => ({
        id: `line-${Date.now()}-${i}`,
        scheduleId: id,
        day: l.day,
        startTime: l.startTime,
        endTime: l.endTime,
        breakMins: Number(l.breakMins) || 0,
      }));
    }

    memoryStore.schedules[idx] = {
      ...existing,
      name: name ? name.trim() : existing.name,
      weeklyHours,
      lines: updatedLines,
    };

    return NextResponse.json(memoryStore.schedules[idx]);
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
      const existing = await db.orm.public.WorkingSchedule.where({ id }).first();
      if (!existing) {
        return NextResponse.json({ error: "Working schedule not found" }, { status: 404 });
      }

      // Check if employees are assigned to this schedule
      const allEmps = await db.orm.public.Employee.all();
      const assigned = allEmps.some((e: any) => e.scheduleId === id);
      if (assigned) {
        return NextResponse.json(
          { error: "Cannot delete working schedule: Employees are assigned to this schedule. Reassign them first." },
          { status: 409 }
        );
      }

      const allLines = await db.orm.public.ScheduleLine.all();
      const lines = allLines.filter((l: any) => l.scheduleId === id);
      for (const line of lines) {
        await db.orm.public.ScheduleLine.where({ id: line.id }).delete();
      }

      await db.orm.public.WorkingSchedule.where({ id }).delete();
      return NextResponse.json({ success: true, message: "Working schedule deleted successfully." });
    } catch (err: any) {
      return NextResponse.json(
        { error: "Database error deleting schedule: " + (err.message || "Unknown error") },
        { status: 500 }
      );
    }
  }

  // MemoryStore fallback
  const idx = memoryStore.schedules.findIndex((s) => s.id === id);
  if (idx === -1) {
    return NextResponse.json({ error: "Working schedule not found" }, { status: 404 });
  }

  const assigned = memoryStore.employees.some((e) => e.scheduleId === id);
  if (assigned) {
    return NextResponse.json(
      { error: "Cannot delete working schedule: Employees are assigned to this schedule. Reassign them first." },
      { status: 409 }
    );
  }

  memoryStore.schedules.splice(idx, 1);
  return NextResponse.json({ success: true, message: "Working schedule deleted successfully." });
}
