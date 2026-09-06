"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { EmployeeRecord, AttendanceRecord } from "@/lib/types";
import {
  LogIn,
  LogOut,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Timer,
  UserCheck,
} from "lucide-react";

interface AttendanceFormProps {
  employees: EmployeeRecord[];
  currentEmployee?: EmployeeRecord | null;
}

export function AttendanceForm({ employees, currentEmployee }: AttendanceFormProps) {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Punch state for employee quick-action
  const [latestAttendance, setLatestAttendance] = useState<AttendanceRecord | null>(null);
  const [punchLoading, setPunchLoading] = useState(false);
  const [punchMessage, setPunchMessage] = useState<string | null>(null);
  const [punchError, setPunchError] = useState<string | null>(null);
  const [liveDuration, setLiveDuration] = useState<string>("");

  const [formData, setFormData] = useState({
    employeeId: currentEmployee?.id || employees[0]?.id || "",
    checkIn: "",
    checkOut: "",
    status: "PRESENT",
  });

  const isEmployee = currentUser?.role === "EMPLOYEE";
  const activeEmployeeId = isEmployee
    ? currentUser?.employeeId || currentEmployee?.id || formData.employeeId
    : formData.employeeId;

  // Fetch latest attendance record for active employee
  const loadLatestAttendance = async (empId: string) => {
    if (!empId) return;
    try {
      const res = await fetch(`/api/attendance?employeeId=${empId}`);
      if (res.ok) {
        const records: AttendanceRecord[] = await res.json();
        if (Array.isArray(records) && records.length > 0) {
          // Sort descending by checkIn
          records.sort(
            (a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime()
          );
          setLatestAttendance(records[0]);
        } else {
          setLatestAttendance(null);
        }
      }
    } catch {}
  };

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored);
        setCurrentUser(user);
        if (user.role === "EMPLOYEE" && user.employeeId) {
          setFormData((prev) => ({ ...prev, employeeId: user.employeeId }));
          loadLatestAttendance(user.employeeId);
        }
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (activeEmployeeId) {
      loadLatestAttendance(activeEmployeeId);
    }
  }, [activeEmployeeId]);

  // Live timer for currently active shift
  useEffect(() => {
    const isOngoing = latestAttendance && !latestAttendance.checkOut;
    if (!isOngoing || !latestAttendance?.checkIn) {
      setLiveDuration("");
      return;
    }

    const updateTimer = () => {
      const start = new Date(latestAttendance.checkIn).getTime();
      const now = Date.now();
      const diffMs = Math.max(0, now - start);

      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, "0");
      setLiveDuration(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [latestAttendance]);

  React.useEffect(() => {
    const now = new Date();
    const defaultCheckIn = new Date(now.setHours(9, 0, 0, 0)).toISOString().slice(0, 16);
    const defaultCheckOut = new Date(now.setHours(17, 0, 0, 0)).toISOString().slice(0, 16);
    setFormData((prev) => ({
      ...prev,
      employeeId: prev.employeeId || currentEmployee?.id || employees[0]?.id || "",
      checkIn: prev.checkIn || defaultCheckIn,
      checkOut: prev.checkOut || defaultCheckOut,
    }));
  }, [employees, currentEmployee]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // One-click Punch In / Punch Out handler
  const handlePunch = async (action: "check-in" | "check-out") => {
    setPunchLoading(true);
    setPunchMessage(null);
    setPunchError(null);

    try {
      const token = localStorage.getItem("peoplepay_token") || localStorage.getItem("token");
      const res = await fetch("/api/attendance/punch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          employeeId: activeEmployeeId,
          action,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Failed to ${action}`);
      }

      setPunchMessage(
        action === "check-in"
          ? `Checked in successfully at ${new Date(data.record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
          : `Checked out successfully! Total worked time: ${data.workedHours ? data.workedHours.toFixed(2) : 0} hrs`
      );

      // Refresh latest attendance
      await loadLatestAttendance(activeEmployeeId);
      router.refresh();
    } catch (err: any) {
      setPunchError(err.message || `Failed to ${action}`);
    } finally {
      setPunchLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.checkIn) {
      setError("Employee and Check In timestamp are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          checkIn: new Date(formData.checkIn).toISOString(),
          checkOut: formData.checkOut ? new Date(formData.checkOut).toISOString() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log attendance");

      router.push("/attendance");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to record attendance");
    } finally {
      setLoading(false);
    }
  };

  const isShiftActive = Boolean(latestAttendance && !latestAttendance.checkOut);

  // If logged in as an EMPLOYEE, display the streamlined One-Click Punch Card
  if (isEmployee) {
    const myEmp = employees.find((e) => e.id === activeEmployeeId) || currentEmployee;

    return (
      <div className="space-y-6 max-w-xl">
        {/* Quick Punch Terminal Card */}
        <div className="bg-white rounded-xl border border-[#E8E3EA] shadow-2xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E3EA]">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#26232A]">Attendance Punch Clock</h3>
                {isShiftActive ? (
                  <Badge variant="success" size="sm">
                    Currently On Duty
                  </Badge>
                ) : (
                  <Badge variant="default" size="sm">
                    Off Duty
                  </Badge>
                )}
              </div>
              <p className="text-xs text-[#77717B] mt-1">
                Record your shift start and end with a single tap. Timestamps and worked hours calculate automatically.
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#F1EBF3] flex items-center justify-center text-[#71547D]">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          {/* Employee Identity Confirmation */}
          <div className="p-3 bg-[#FAF9FB] rounded-lg border border-[#E8E3EA] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#9B7FA6] text-white flex items-center justify-center font-bold text-xs">
                {myEmp?.firstName?.[0] || "E"}
              </div>
              <div>
                <span className="text-xs font-semibold text-[#26232A]">
                  {myEmp ? `${myEmp.firstName} ${myEmp.lastName}` : "Employee"}
                </span>
                <p className="text-[11px] text-[#77717B]">
                  {myEmp?.jobPosition || "Staff"} • {myEmp?.department || "Operations"}
                </p>
              </div>
            </div>
            <span className="text-[11px] font-medium text-[#71547D] bg-[#F1EBF3] px-2.5 py-1 rounded-md">
              Verified User
            </span>
          </div>

          {/* Active Shift Display / Duration */}
          {isShiftActive && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                  <Timer className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
                    Shift In Progress
                  </div>
                  <div className="text-xs text-emerald-700">
                    Checked in today at{" "}
                    <span className="font-bold">
                      {latestAttendance?.checkIn ? new Date(latestAttendance.checkIn).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      }) : ""}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-emerald-600 font-medium">Elapsed</div>
                <div className="text-lg font-mono font-bold text-emerald-900">
                  {liveDuration || "00:00:00"}
                </div>
              </div>
            </div>
          )}

          {/* Alerts */}
          {punchMessage && (
            <div className="p-3.5 bg-[#EDF4EE] border border-[#CCE0D1] rounded-lg text-xs text-[#3D6B49] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-[#5D8A6B]" />
              <span>{punchMessage}</span>
            </div>
          )}

          {punchError && (
            <div className="p-3.5 bg-[#FAECEC] border border-[#E9C3C3] rounded-lg text-xs text-[#9A4E4E] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{punchError}</span>
            </div>
          )}

          {/* Check-In / Check-Out Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <Button
              type="button"
              size="lg"
              onClick={() => handlePunch("check-in")}
              isLoading={punchLoading && !isShiftActive}
              disabled={Boolean(punchLoading || isShiftActive)}
              className={`h-14 font-semibold text-sm shadow-xs ${
                !isShiftActive
                  ? "bg-[#9B7FA6] hover:bg-[#886B94] text-white"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
            >
              <LogIn className="w-4 h-4 mr-2" />
              <span>Check In</span>
            </Button>

            <Button
              type="button"
              size="lg"
              onClick={() => handlePunch("check-out")}
              isLoading={punchLoading && isShiftActive}
              disabled={Boolean(punchLoading || !isShiftActive)}
              className={`h-14 font-semibold text-sm shadow-xs ${
                isShiftActive
                  ? "bg-[#71547D] hover:bg-[#5E4469] text-white"
                  : "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              }`}
            >
              <LogOut className="w-4 h-4 mr-2" />
              <span>Check Out</span>
            </Button>
          </div>

          {/* Recent Entry Details if checked out */}
          {!isShiftActive && latestAttendance?.checkOut && (
            <div className="pt-4 border-t border-[#E8E3EA] flex items-center justify-between text-xs text-[#77717B]">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#A49FA8]" />
                <span>Last Shift:</span>
                <span className="font-semibold text-[#26232A]">
                  {new Date(latestAttendance.checkIn).toLocaleDateString([], {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span>
                  ({new Date(latestAttendance.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {" - "}
                  {new Date(latestAttendance.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})
                </span>
              </div>
              <span className="font-bold text-[#71547D] bg-[#F1EBF3] px-2 py-0.5 rounded">
                {latestAttendance.workedHours ? `${latestAttendance.workedHours.toFixed(2)} hrs` : "—"}
              </span>
            </div>
          )}

          {/* Navigation link */}
          <div className="flex justify-end pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => router.push("/attendance")}
            >
              View Attendance History
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Admin & Manager View (Retains manual time logger option for staff corrections)
  const employeeOptions = employees.map((e) => ({
    value: e.id,
    label: `${e.firstName} ${e.lastName} (${e.jobPosition || "Staff"})`,
  }));

  const statusOptions = [
    { value: "PRESENT", label: "Present" },
    { value: "LATE", label: "Late" },
    { value: "OVERTIME", label: "Overtime" },
    { value: "ABSENT", label: "Absent" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Quick Punch Bar for Managers */}
      <div className="bg-white p-5 rounded-xl border border-[#E8E3EA] shadow-2xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E3EA]">
          <div>
            <h3 className="text-sm font-bold text-[#26232A]">Quick Punch (Check-In / Check-Out)</h3>
            <p className="text-xs text-[#77717B]">
              Quickly record current real-time timestamp for selected employee
            </p>
          </div>
          {isShiftActive ? (
            <Badge variant="success" size="sm">Currently In</Badge>
          ) : (
            <Badge variant="default" size="sm">Currently Out</Badge>
          )}
        </div>

        {punchMessage && (
          <div className="p-3 bg-[#EDF4EE] border border-[#CCE0D1] rounded-lg text-xs text-[#3D6B49] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#5D8A6B]" />
            <span>{punchMessage}</span>
          </div>
        )}

        {punchError && (
          <div className="p-3 bg-[#FAECEC] border border-[#E9C3C3] rounded-lg text-xs text-[#9A4E4E] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{punchError}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            type="button"
            size="sm"
            onClick={() => handlePunch("check-in")}
            isLoading={punchLoading && !isShiftActive}
            disabled={Boolean(punchLoading || isShiftActive)}
            className="flex-1"
          >
            <LogIn className="w-3.5 h-3.5 mr-1.5" />
            Check In Now
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => handlePunch("check-out")}
            isLoading={punchLoading && isShiftActive}
            disabled={Boolean(punchLoading || !isShiftActive)}
            className="flex-1"
          >
            <LogOut className="w-3.5 h-3.5 mr-1.5" />
            Check Out Now
          </Button>
        </div>
      </div>

      {/* Manual Detailed Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white p-6 rounded-xl border border-[#E8E3EA] shadow-2xs"
      >
        {error && (
          <div className="p-3 bg-[#FAECEC] border border-[#E9C3C3] rounded-md text-xs text-[#9A4E4E]">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="border-b border-[#E8E3EA] pb-2">
            <h3 className="text-sm font-semibold text-[#26232A]">Manual Entry & Correction</h3>
            <p className="text-xs text-[#77717B]">
              Specify custom check-in and check-out timestamps. Worked hours will be automatically derived.
            </p>
          </div>

          <Select
            label="Employee"
            value={formData.employeeId}
            options={employeeOptions}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Check In Time"
              type="datetime-local"
              value={formData.checkIn}
              onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
              required
            />
            <Input
              label="Check Out Time"
              type="datetime-local"
              value={formData.checkOut}
              onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
              helperText="Leave empty if shift is ongoing"
            />
          </div>

          <Select
            label="Status"
            value={formData.status}
            options={statusOptions}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E3EA]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" size="sm" variant="primary" isLoading={loading}>
            Save Record
          </Button>
        </div>
      </form>
    </div>
  );
}

