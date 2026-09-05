"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { StatCard } from "@/components/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import {
  Users,
  FileText,
  Clock,
  Palmtree,
  DollarSign,
  Plus,
  ArrowRight,
  TrendingUp,
  Building2,
  CheckCircle2,
  Calendar,
} from "lucide-react";

interface DashboardMetrics {
  totalEmployees: number;
  activeEmployees: number;
  activeContracts: number;
  totalAnnualWage: number;
  avgWage: number;
  todayAttendances: number;
  approvedLeaves: number;
  departmentDistribution: { [key: string]: number };
  recentEmployees: any[];
  recentAttendances: any[];
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);

        // Parallel fetch for Person A's data + teammate endpoints
        const [empRes, contractRes, attRes, leaveRes] = await Promise.all([
          fetch("/api/employees").catch(() => null),
          fetch("/api/contracts").catch(() => null),
          fetch("/api/attendance").catch(() => null),
          fetch("/api/time-off-requests").catch(() => null),
        ]);

        const employees = empRes && empRes.ok ? await empRes.json() : [];
        const contracts = contractRes && contractRes.ok ? await contractRes.json() : [];
        const attendances = attRes && attRes.ok ? await attRes.json() : [];
        const leaves = leaveRes && leaveRes.ok ? await leaveRes.json() : [];

        // 1. Employee metrics
        const totalEmployees = Array.isArray(employees) ? employees.length : 0;
        const activeEmployees = Array.isArray(employees)
          ? employees.filter((e: any) => e.status === "ACTIVE").length
          : 0;

        // Department breakdown
        const deptDist: { [key: string]: number } = {};
        if (Array.isArray(employees)) {
          employees.forEach((e: any) => {
            const dept = e.department || "Unassigned";
            deptDist[dept] = (deptDist[dept] || 0) + 1;
          });
        }

        // 2. Contract metrics
        const activeContractsList = Array.isArray(contracts)
          ? contracts.filter((c: any) => c.status === "ACTIVE")
          : [];
        const activeContracts = activeContractsList.length;
        const totalWage = activeContractsList.reduce((sum: number, c: any) => sum + (Number(c.wage) || 0), 0);
        const avgWage = activeContracts > 0 ? Math.round(totalWage / activeContracts) : 0;

        // 3. Attendance metrics (today / total logged)
        const todayStr = new Date().toISOString().split("T")[0];
        const todayList = Array.isArray(attendances)
          ? attendances.filter((a: any) => a.checkIn && a.checkIn.startsWith(todayStr))
          : [];
        const todayAttendances = todayList.length > 0 ? todayList.length : (Array.isArray(attendances) ? attendances.length : 0);

        // 4. Time Off (approved leaves)
        const approvedLeaves = Array.isArray(leaves)
          ? leaves.filter((l: any) => l.status === "APPROVED").length
          : 0;

        setMetrics({
          totalEmployees,
          activeEmployees,
          activeContracts,
          totalAnnualWage: totalWage,
          avgWage,
          todayAttendances,
          approvedLeaves,
          departmentDistribution: deptDist,
          recentEmployees: Array.isArray(employees) ? employees.slice(0, 5) : [],
          recentAttendances: Array.isArray(attendances) ? attendances.slice(0, 5) : [],
        });
      } catch (err) {
        console.error("Failed to load dashboard metrics", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  return (
    <AppShell
      breadcrumbs={[{ label: "Workspace" }, { label: "Overview" }]}
      title="Company Overview"
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/employees/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#71547D] hover:bg-[#5E4469] text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Employee</span>
          </Link>
          <Link
            href="/attendance/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#E8E3EA] hover:border-[#DCD4DF] text-[#26232A] text-xs font-medium shadow-2xs transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-[#77717B]" />
            <span>Log Attendance</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6 max-w-6xl">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-[#FAF8FA] via-[#F4EEF6] to-[#EFE7F2] p-6 rounded-xl border border-[#E8E3EA] shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E5D7E8] text-[#71547D] text-[11px] font-semibold mb-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>PeoplePay HR & Payroll Platform</span>
            </div>
            <h2 className="text-xl font-bold text-[#26232A]">
              Good day!
            </h2>
            <p className="text-xs text-[#524E57] mt-1 max-w-xl">
              Track live headcount, active compensation contracts, daily attendance logs, and cross-department workforce activity.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/contracts/new"
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#71547D] hover:underline"
            >
              Draft Contract <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Top KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            <>
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
              <Skeleton className="h-28" />
            </>
          ) : (
            <>
              <StatCard
                title="Total Employees"
                value={metrics?.totalEmployees || 0}
                description={`${metrics?.activeEmployees || 0} currently active`}
                icon={<Users className="w-4 h-4" />}
                variant="purple"
              />
              <StatCard
                title="Active Contracts"
                value={metrics?.activeContracts || 0}
                description={`Avg Salary: $${(metrics?.avgWage || 0).toLocaleString()}/yr`}
                icon={<FileText className="w-4 h-4" />}
                variant="green"
              />
              <StatCard
                title="Logged Shifts"
                value={metrics?.todayAttendances || 0}
                description="Attendance entries recorded"
                icon={<Clock className="w-4 h-4" />}
                variant="amber"
              />
              <StatCard
                title="Approved Leaves"
                value={metrics?.approvedLeaves || 0}
                description="Time off requests confirmed"
                icon={<Palmtree className="w-4 h-4" />}
                variant="blue"
              />
            </>
          )}
        </div>

        {/* Middle Section: Department Distribution & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Department Breakdown */}
          <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-[#E8E3EA] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E3EA] pb-3">
              <div>
                <h3 className="text-sm font-semibold text-[#26232A]">
                  Workforce by Department
                </h3>
                <p className="text-xs text-[#77717B]">
                  Headcount distribution across company units
                </p>
              </div>
              <Link
                href="/employees"
                className="text-xs font-semibold text-[#71547D] hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            ) : Object.keys(metrics?.departmentDistribution || {}).length === 0 ? (
              <p className="text-xs text-[#77717B] py-6 text-center">
                No employees recorded yet.
              </p>
            ) : (
              <div className="space-y-3 pt-1">
                {Object.entries(metrics?.departmentDistribution || {}).map(
                  ([dept, count]) => {
                    const total = metrics?.totalEmployees || 1;
                    const pct = Math.round((count / total) * 100);
                    return (
                      <div key={dept} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-medium text-[#26232A]">{dept}</span>
                          <span className="text-[#77717B]">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2 bg-[#F1EBF3] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#71547D] rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </div>

          {/* Quick Nav / Operational Links */}
          <div className="bg-white p-5 rounded-lg border border-[#E8E3EA] shadow-2xs space-y-4">
            <div className="border-b border-[#E8E3EA] pb-3">
              <h3 className="text-sm font-semibold text-[#26232A]">
                Quick Operations
              </h3>
              <p className="text-xs text-[#77717B]">Direct shortcuts to Person A modules</p>
            </div>

            <div className="space-y-2.5">
              <Link
                href="/employees/new"
                className="flex items-center justify-between p-3 rounded-lg border border-[#E8E3EA] hover:border-[#9B7FA6]/60 hover:bg-[#FCFBFD] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#F1EBF3] text-[#71547D] flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#26232A] group-hover:text-[#71547D] transition-colors">
                      Onboard Employee
                    </h4>
                    <p className="text-[11px] text-[#77717B]">Register profile & schedule</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#A49FA8] group-hover:text-[#71547D] transition-colors" />
              </Link>

              <Link
                href="/contracts/new"
                className="flex items-center justify-between p-3 rounded-lg border border-[#E8E3EA] hover:border-[#9B7FA6]/60 hover:bg-[#FCFBFD] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#EDF4EE] text-[#3D6B49] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#26232A] group-hover:text-[#3D6B49] transition-colors">
                      New Contract Agreement
                    </h4>
                    <p className="text-[11px] text-[#77717B]">Define wages & durations</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#A49FA8] group-hover:text-[#3D6B49] transition-colors" />
              </Link>

              <Link
                href="/schedules/new"
                className="flex items-center justify-between p-3 rounded-lg border border-[#E8E3EA] hover:border-[#9B7FA6]/60 hover:bg-[#FCFBFD] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#EDF2F7] text-[#4F6785] flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#26232A] group-hover:text-[#4F6785] transition-colors">
                      Configure Schedule
                    </h4>
                    <p className="text-[11px] text-[#77717B]">Weekly hours & break times</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#A49FA8] group-hover:text-[#4F6785] transition-colors" />
              </Link>

              <Link
                href="/attendance/new"
                className="flex items-center justify-between p-3 rounded-lg border border-[#E8E3EA] hover:border-[#9B7FA6]/60 hover:bg-[#FCFBFD] transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-[#FBF4E8] text-[#866332] flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#26232A] group-hover:text-[#866332] transition-colors">
                      Check-In / Out
                    </h4>
                    <p className="text-[11px] text-[#77717B]">Log or adjust daily shift</p>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#A49FA8] group-hover:text-[#866332] transition-colors" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Section: Recent Employees & Attendances */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Employees */}
          <div className="bg-white p-5 rounded-lg border border-[#E8E3EA] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E3EA] pb-3">
              <h3 className="text-sm font-semibold text-[#26232A]">
                Recent Team Members
              </h3>
              <Link
                href="/employees"
                className="text-xs font-semibold text-[#71547D] hover:underline"
              >
                Directory
              </Link>
            </div>

            {loading ? (
              <Skeleton className="h-32" />
            ) : metrics?.recentEmployees.length === 0 ? (
              <p className="text-xs text-[#77717B] py-4 text-center">
                No employees registered yet.
              </p>
            ) : (
              <div className="divide-y divide-[#E8E3EA]/60">
                {metrics?.recentEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <Link
                        href={`/employees/${emp.id}`}
                        className="font-semibold text-[#26232A] hover:text-[#71547D] transition-colors"
                      >
                        {emp.firstName} {emp.lastName}
                      </Link>
                      <p className="text-[11px] text-[#77717B]">
                        {emp.jobPosition || "Staff"} • {emp.department}
                      </p>
                    </div>
                    <Badge
                      variant={emp.status === "ACTIVE" ? "success" : "danger"}
                      size="sm"
                    >
                      {emp.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Attendance Logs */}
          <div className="bg-white p-5 rounded-lg border border-[#E8E3EA] shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E3EA] pb-3">
              <h3 className="text-sm font-semibold text-[#26232A]">
                Recent Attendance Activity
              </h3>
              <Link
                href="/attendance"
                className="text-xs font-semibold text-[#71547D] hover:underline"
              >
                All records
              </Link>
            </div>

            {loading ? (
              <Skeleton className="h-32" />
            ) : metrics?.recentAttendances.length === 0 ? (
              <p className="text-xs text-[#77717B] py-4 text-center">
                No attendance records yet.
              </p>
            ) : (
              <div className="divide-y divide-[#E8E3EA]/60">
                {metrics?.recentAttendances.map((att) => (
                  <div
                    key={att.id}
                    className="py-2.5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-[#26232A]">
                        {att.employee
                          ? `${att.employee.firstName} ${att.employee.lastName}`
                          : `ID: ${att.employeeId.slice(0, 8)}`}
                      </span>
                      <p className="text-[11px] text-[#77717B]">
                        {att.checkIn ? new Date(att.checkIn).toLocaleString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }) : "—"}{" "}
                        {att.workedHours ? `(${att.workedHours.toFixed(1)} hrs)` : ""}
                      </p>
                    </div>
                    <Badge
                      variant={
                        att.status === "PRESENT"
                          ? "success"
                          : att.status === "LATE"
                            ? "warning"
                            : "purple"
                      }
                      size="sm"
                    >
                      {att.status.replace("_", " ")}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
