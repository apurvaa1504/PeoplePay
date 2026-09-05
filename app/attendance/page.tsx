"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AttendanceTable } from "@/components/attendance/AttendanceTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { AttendanceRecord } from "@/lib/types";
import { Plus, Clock, Filter } from "lucide-react";

export default function AttendancePage() {
  const searchParams = useSearchParams();
  const employeeFilter = searchParams.get("employeeId") || "";

  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (employeeFilter) params.append("employeeId", employeeFilter);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/attendance?${params.toString()}`);
      if (!res.ok) throw new Error("Could not load attendance records.");
      const data = await res.json();
      setAttendances(data);
    } catch (err: any) {
      setError(err.message || "Failed to load attendance.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [employeeFilter, statusFilter]);

  return (
    <AppShell
      breadcrumbs={[{ label: "Operations" }, { label: "Attendance" }]}
      title="Attendance Records"
      actions={
        <Link
          href="/attendance/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#9B7FA6] hover:bg-[#886B94] text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Record Attendance</span>
        </Link>
      }
    >
      <div className="space-y-4">
        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E8E3EA] shadow-2xs">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#A49FA8]" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-md border border-[#E8E3EA] bg-[#FCFBFD] px-2.5 py-1.5 text-xs text-[#524E57] focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 cursor-pointer"
            >
              <option value="">All Attendance Statuses</option>
              <option value="PRESENT">Present</option>
              <option value="LATE">Late</option>
              <option value="MANUAL_CORRECTION">Manual Correction</option>
              <option value="OVERTIME">Overtime</option>
              <option value="ABSENT">Absent</option>
            </select>
          </div>

          {employeeFilter && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#77717B]">Filtering by Employee:</span>
              <span className="font-semibold text-[#71547D] bg-[#F1EBF3] px-2 py-0.5 rounded">
                ID: {employeeFilter.slice(0, 8)}
              </span>
              <Link
                href="/attendance"
                className="text-[#B56767] hover:underline text-[11px]"
              >
                Clear filter
              </Link>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-[#FAECEC] border border-[#E9C3C3] rounded-lg text-xs text-[#9A4E4E]">
            {error}
          </div>
        )}

        {loading && <TableSkeleton rows={4} cols={7} />}

        {!loading && !error && attendances.length === 0 && (
          <EmptyState
            icon={<Clock className="w-6 h-6" />}
            title="No attendance records found"
            description="No check-in entries recorded for this filter. Record attendance or clear filters."
            actionLabel="Record Attendance"
            actionHref="/attendance/new"
          />
        )}

        {!loading && !error && attendances.length > 0 && (
          <AttendanceTable
            attendances={attendances}
            onRecordUpdated={fetchAttendance}
          />
        )}
      </div>
    </AppShell>
  );
}
