"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { AttendanceTable } from "@/components/attendance/AttendanceTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { AttendanceRecord } from "@/lib/types";
import { Plus, Clock, Filter } from "lucide-react";

function AttendanceContent() {
  const searchParams = useSearchParams();
  const employeeFilter = searchParams.get("employeeId") || "";

  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      setError(null);

      // Determine employee ID to filter by
      const storedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      const parsedUser = storedUser ? JSON.parse(storedUser) : null;
      const isEmployee = parsedUser?.role === "EMPLOYEE";
      const targetEmpId = isEmployee ? (parsedUser?.employeeId || "none") : employeeFilter;

      const params = new URLSearchParams();
      if (targetEmpId) params.append("employeeId", targetEmpId);
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

  // Employee Quick Punch banner state
  const isEmployee = currentUser?.role === "EMPLOYEE";
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchMsg, setPunchMsg] = useState<string | null>(null);

  // Check if active shift is running
  const latestShift = attendances[0];
  const isCurrentlyWorking = latestShift && !latestShift.checkOut;

  const handleQuickPunch = async (action: "check-in" | "check-out") => {
    setPunchLoading(true);
    setPunchMsg(null);
    try {
      const token = localStorage.getItem("peoplepay_token") || localStorage.getItem("token");
      const res = await fetch("/api/attendance/punch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Punch failed");
      setPunchMsg(
        action === "check-in"
          ? `Checked in at ${new Date(data.record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : `Checked out! Worked ${data.workedHours ? data.workedHours.toFixed(2) : 0} hrs`
      );
      await fetchAttendance();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPunchLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Employee Quick Punch Card Banner */}
      {isEmployee && (
        <div className="p-4 bg-white rounded-xl border border-[#E8E3EA] shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isCurrentlyWorking ? 'bg-emerald-100 text-emerald-700' : 'bg-[#F1EBF3] text-[#71547D]'
            }`}>
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#26232A]">Punch Clock</span>
                {isCurrentlyWorking ? (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Shift In Progress
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-[#77717B] bg-slate-100 px-2 py-0.5 rounded-full">
                    Off Duty
                  </span>
                )}
              </div>
              <p className="text-xs text-[#77717B] mt-0.5">
                {isCurrentlyWorking && latestShift
                  ? `Checked in today at ${new Date(latestShift.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                  : punchMsg || "Click Check In to start your work shift timestamp"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!isCurrentlyWorking ? (
              <button
                onClick={() => handleQuickPunch("check-in")}
                disabled={punchLoading}
                className="px-4 py-2 bg-[#9B7FA6] hover:bg-[#886B94] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Check In Now</span>
              </button>
            ) : (
              <button
                onClick={() => handleQuickPunch("check-out")}
                disabled={punchLoading}
                className="px-4 py-2 bg-[#71547D] hover:bg-[#5E4469] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Check Out Now</span>
              </button>
            )}
          </div>
        </div>
      )}

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

        {currentUser?.role === "EMPLOYEE" ? (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#77717B]">Showing:</span>
            <span className="font-semibold text-[#71547D] bg-[#F1EBF3] px-2.5 py-0.5 rounded">
              My Attendance Records
            </span>
          </div>
        ) : (
          employeeFilter && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#77717B]">Filtering by Employee:</span>
              <span className="font-semibold text-[#71547D] bg-[#F1EBF3] px-2 py-0.5 rounded">
                #{employeeFilter.replace(/-/g, '').slice(-6).toUpperCase()}
              </span>
              <Link
                href="/attendance"
                className="text-[#B56767] hover:underline text-[11px]"
              >
                Clear filter
              </Link>
            </div>
          )
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
  );
}

export default function AttendancePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setCurrentUser(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const isEmployee = currentUser?.role === "EMPLOYEE";

  return (
    <AppShell
      breadcrumbs={[{ label: "Operations" }, { label: "Attendance" }]}
      title={isEmployee ? "My Attendance" : "Attendance Records"}
      actions={
        <Link
          href="/attendance/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#9B7FA6] hover:bg-[#886B94] text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Clock className="w-4 h-4" />
          <span>{isEmployee ? "Check In / Out" : "Record Attendance"}</span>
        </Link>
      }
    >
      <Suspense fallback={<TableSkeleton rows={4} cols={7} />}>
        <AttendanceContent />
      </Suspense>
    </AppShell>
  );
}
