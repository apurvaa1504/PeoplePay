"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmployeeRecord } from "@/lib/types";
import {
  FileText,
  Clock,
  Palmtree,
  ArrowLeft,
  Building2,
  Briefcase,
  UserCheck,
  Calendar,
  Edit,
} from "lucide-react";

export default function EmployeeDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [employee, setEmployee] = useState<
    (EmployeeRecord & { contractsCount?: number; attendanceCount?: number }) | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEmployee() {
      try {
        setLoading(true);
        const res = await fetch(`/api/employees/${id}`);
        if (!res.ok) throw new Error("Employee record could not be loaded.");
        const data = await res.json();
        setEmployee(data);
      } catch (err: any) {
        setError(err.message || "Failed to load employee.");
      } finally {
        setLoading(false);
      }
    }
    if (id) loadEmployee();
  }, [id]);

  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setCurrentUserRole(JSON.parse(stored).role);
      }
    } catch {}
  }, []);

  const isEmployeeSelfService = currentUserRole === "EMPLOYEE";

  if (loading) {
    return (
      <AppShell
        breadcrumbs={
          isEmployeeSelfService
            ? [{ label: "Self Service" }, { label: "My Details" }]
            : [{ label: "Employees", href: "/employees" }, { label: "Profile" }]
        }
        title={isEmployeeSelfService ? "My Details" : "Employee Profile"}
      >
        <div className="space-y-6 max-w-4xl">
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        </div>
      </AppShell>
    );
  }

  if (error || !employee) {
    return (
      <AppShell
        breadcrumbs={[{ label: "Employees", href: "/employees" }, { label: "Error" }]}
        title="Employee Profile"
      >
        <div className="p-6 bg-white rounded-lg border border-[#E8E3EA] text-center max-w-md mx-auto my-12">
          <p className="text-sm font-semibold text-[#B56767] mb-2">Employee Not Found</p>
          <p className="text-xs text-[#77717B] mb-4">
            The requested employee record does not exist or may have been deleted.
          </p>
          <Link
            href="/employees"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F1EBF3] text-[#71547D] text-xs font-semibold hover:bg-[#E8DFEC]"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Employees
          </Link>
        </div>
      </AppShell>
    );
  }

  const initials = `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`.toUpperCase();

  return (
    <AppShell
      breadcrumbs={
        isEmployeeSelfService
          ? [{ label: "Self Service" }, { label: "My Details" }]
          : [
              { label: "People", href: "/employees" },
              { label: "Employees", href: "/employees" },
              { label: `${employee.firstName} ${employee.lastName}` },
            ]
      }
      title={isEmployeeSelfService ? "My Details" : `${employee.firstName} ${employee.lastName}`}
      actions={
        !isEmployeeSelfService ? (
          <div className="flex items-center gap-2">
            <Link
              href={`/employees/${employee.id}/edit`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-[#E8E3EA] hover:border-[#DCD4DF] text-[#26232A] text-xs font-medium shadow-2xs transition-colors"
            >
              <Edit className="w-3.5 h-3.5 text-[#77717B]" />
              <span>Edit Profile</span>
            </Link>
          </div>
        ) : null
      }
    >
      <div className="space-y-6 max-w-5xl">
        {/* Back navigation only for HR / Admin */}
        {!isEmployeeSelfService && (
          <Link
            href="/employees"
            className="inline-flex items-center gap-1.5 text-xs text-[#77717B] hover:text-[#26232A] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to employee list
          </Link>
        )}

        {/* Identity Header Card */}
        <div className="bg-white rounded-lg border border-[#E8E3EA] p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#F1EBF3] border-2 border-[#E0D3E3] text-[#71547D] font-bold text-xl flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-[#26232A]">
                  {employee.firstName} {employee.lastName}
                </h2>
                <Badge
                  variant={employee.status === "ACTIVE" ? "success" : "danger"}
                  size="sm"
                >
                  {employee.status}
                </Badge>
              </div>
              <p className="text-xs text-[#77717B] mt-0.5">
                {employee.jobPosition || "Position not specified"} • {employee.department || "No Department"}
              </p>
              <p className="text-[11px] text-[#A49FA8] mt-1 font-mono">
                ID: {employee.id}
              </p>
            </div>
          </div>
        </div>

        {/* Smart Links / Buttons to Contracts, Attendance, Time Off */}
        <div>
          <h3 className="text-xs font-bold text-[#77717B] uppercase tracking-wider mb-3">
            Quick Actions & Smart Records
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Smart Link: Contracts */}
            <Link
              href={`/contracts?employeeId=${employee.id}`}
              className="bg-white p-4 rounded-lg border border-[#E8E3EA] hover:border-[#9B7FA6]/60 shadow-2xs hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-md bg-[#F1EBF3] text-[#71547D] flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold px-2 py-0.5 bg-[#F9F8FA] text-[#26232A] rounded-full border border-[#E8E3EA]">
                  {employee.contractsCount ?? "—"}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-[#26232A] group-hover:text-[#71547D] transition-colors">
                Contracts
              </h4>
              <p className="text-[11px] text-[#77717B] mt-0.5">
                View active salary agreements and terms.
              </p>
            </Link>

            {/* Smart Link: Attendance */}
            <Link
              href={`/attendance?employeeId=${employee.id}`}
              className="bg-white p-4 rounded-lg border border-[#E8E3EA] hover:border-[#9B7FA6]/60 shadow-2xs hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-md bg-[#EDF4EE] text-[#3D6B49] flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold px-2 py-0.5 bg-[#F9F8FA] text-[#26232A] rounded-full border border-[#E8E3EA]">
                  {employee.attendanceCount ?? "—"}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-[#26232A] group-hover:text-[#71547D] transition-colors">
                Attendance Log
              </h4>
              <p className="text-[11px] text-[#77717B] mt-0.5">
                Check-in timestamps and worked hours history.
              </p>
            </Link>

            {/* Smart Link: Time Off */}
            <Link
              href={`/time-off?employeeId=${employee.id}`}
              className="bg-white p-4 rounded-lg border border-[#E8E3EA] hover:border-[#9B7FA6]/60 shadow-2xs hover:shadow-xs transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="w-8 h-8 rounded-md bg-[#EDF2F7] text-[#4F6785] flex items-center justify-center">
                  <Palmtree className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold px-2 py-0.5 bg-[#F9F8FA] text-[#26232A] rounded-full border border-[#E8E3EA]">
                  View
                </span>
              </div>
              <h4 className="text-sm font-semibold text-[#26232A] group-hover:text-[#71547D] transition-colors">
                Time Off
              </h4>
              <p className="text-[11px] text-[#77717B] mt-0.5">
                Leave requests and holiday allocations.
              </p>
            </Link>
          </div>
        </div>

        {/* Detailed Info Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Work Details */}
          <div className="bg-white p-5 rounded-lg border border-[#E8E3EA] shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-[#77717B] uppercase tracking-wider border-b border-[#E8E3EA] pb-2">
              Employment Details
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#F9F8FA]">
                <span className="text-[#77717B] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#A49FA8]" /> Department
                </span>
                <span className="font-semibold text-[#26232A]">
                  {employee.department || "Not Assigned"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#F9F8FA]">
                <span className="text-[#77717B] flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#A49FA8]" /> Position
                </span>
                <span className="font-semibold text-[#26232A]">
                  {employee.jobPosition || "Not Assigned"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#F9F8FA]">
                <span className="text-[#77717B] flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#A49FA8]" /> Reporting Manager
                </span>
                <span className="font-semibold text-[#26232A]">
                  {employee.manager
                    ? `${employee.manager.firstName} ${employee.manager.lastName}`
                    : "None (Direct Report)"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-[#77717B] flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#A49FA8]" /> Working Schedule
                </span>
                <span className="font-semibold text-[#26232A]">
                  {employee.schedule
                    ? `${employee.schedule.name} (${employee.schedule.weeklyHours} hrs)`
                    : "Standard Schedule"}
                </span>
              </div>
            </div>
          </div>

          {/* System & Metadata */}
          <div className="bg-white p-5 rounded-lg border border-[#E8E3EA] shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-[#77717B] uppercase tracking-wider border-b border-[#E8E3EA] pb-2">
              System Information
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-[#F9F8FA]">
                <span className="text-[#77717B]">Record Status</span>
                <Badge variant={employee.status === "ACTIVE" ? "success" : "danger"} size="sm">
                  {employee.status}
                </Badge>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-[#F9F8FA]">
                <span className="text-[#77717B]">Created Timestamp</span>
                <span className="font-mono text-[11px] text-[#26232A]">
                  {new Date(employee.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-[#77717B]">Department Status</span>
                <span className="text-[#71547D] font-medium text-[11px] bg-[#F1EBF3] px-2 py-0.5 rounded">
                  {employee.department ? "Assigned" : "Unassigned"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
