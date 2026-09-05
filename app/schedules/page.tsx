"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ScheduleTable } from "@/components/schedules/ScheduleTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { WorkingScheduleRecord } from "@/lib/types";
import { Plus, Calendar } from "lucide-react";

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<WorkingScheduleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/schedules");
      if (!res.ok) throw new Error("Could not load working schedules.");
      const data = await res.json();
      setSchedules(data);
    } catch (err: any) {
      setError(err.message || "Failed to load schedules.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

  return (
    <AppShell
      breadcrumbs={[{ label: "Operations" }, { label: "Working Schedules" }]}
      title="Working Schedules"
      actions={
        <Link
          href="/schedules/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#9B7FA6] hover:bg-[#886B94] text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Schedule</span>
        </Link>
      }
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-[#77717B]">
            Configure weekly working hours, shifts, and daily break times. Weekly hours are automatically calculated from schedule lines.
          </p>
        </div>

        {error && (
          <div className="p-4 bg-[#FAECEC] border border-[#E9C3C3] rounded-lg text-xs text-[#9A4E4E]">
            {error}
          </div>
        )}

        {loading && <TableSkeleton rows={3} cols={4} />}

        {!loading && !error && schedules.length === 0 && (
          <EmptyState
            icon={<Calendar className="w-6 h-6" />}
            title="No working schedules found"
            description="Create weekly schedules with custom daily shifts and automatic hour calculations."
            actionLabel="New Schedule"
            actionHref="/schedules/new"
          />
        )}

        {!loading && !error && schedules.length > 0 && (
          <ScheduleTable schedules={schedules} />
        )}
      </div>
    </AppShell>
  );
}
