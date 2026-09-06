"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { EmployeeTable } from "@/components/employees/EmployeeTable";
import { EmployeeCard } from "@/components/employees/EmployeeCard";
import { EmployeeFilters } from "@/components/employees/EmployeeFilters";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton, CardGridSkeleton } from "@/components/ui/Skeleton";
import { EmployeeRecord } from "@/lib/types";
import { Plus, Users, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

const PAGE_SIZE = 10;

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const user = JSON.parse(stored);
        setCurrentUserRole(user.role);
        if (user.role === "EMPLOYEE") {
          if (user.employeeId) {
            window.location.replace(`/employees/${user.employeeId}`);
            return;
          } else if (user.id) {
            fetch(`/api/employees?userId=${user.id}`)
              .then((res) => res.json())
              .then((list) => {
                if (Array.isArray(list) && list.length > 0) {
                  user.employeeId = list[0].id;
                  localStorage.setItem("user", JSON.stringify(user));
                  window.location.replace(`/employees/${list[0].id}`);
                }
              })
              .catch(() => {});
          }
        }
      }
    } catch {}
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (department) params.append("department", department);
      if (status) params.append("status", status);

      const res = await fetch(`/api/employees?${params.toString()}`);
      if (!res.ok) throw new Error("Unable to retrieve employee records.");
      const data = await res.json();
      setEmployees(data);
      setPage(1);
    } catch (err: any) {
      setError(err.message || "Something went wrong while retrieving employee records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [department, status]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  const uniqueDepartments = Array.from(
    new Set(employees.map((e) => e.department).filter(Boolean) as string[])
  );

  const activeEmployees = employees.filter((e) => e.status === "ACTIVE");
  const inactiveEmployees = employees.filter((e) => e.status === "INACTIVE");

  const totalPages = Math.max(1, Math.ceil(employees.length / PAGE_SIZE));
  const pagedEmployees = employees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const rangeStart = employees.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, employees.length);

  if (currentUserRole === "EMPLOYEE") {
    return (
      <AppShell
        breadcrumbs={[{ label: "Self Service" }, { label: "My Details" }]}
        title="My Details"
      >
        <div className="flex flex-col items-center justify-center min-h-[300px] gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-[#9B7FA6] border-t-transparent animate-spin" />
          <p className="text-xs text-[#77717B]">Opening your employee details...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      breadcrumbs={[{ label: "People" }, { label: "Employees" }]}
      title="Employees"
      actions={
        <Link
          href="/employees/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#9B7FA6] hover:bg-[#886B94] text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add employee</span>
        </Link>
      }
    >
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <p className="text-xs text-[#77717B]">
              Manage employee records, assignments and employment status across all departments.
            </p>
          </div>
          <div className="text-xs text-[#77717B]">
            Showing <span className="font-semibold text-[#26232A]">{employees.length}</span> employees
          </div>
        </div>

        <EmployeeFilters
          search={search}
          onSearchChange={setSearch}
          department={department}
          onDepartmentChange={setDepartment}
          status={status}
          onStatusChange={setStatus}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          departments={uniqueDepartments}
        />

        {error && (
          <div className="p-4 bg-[#FAECEC] border border-[#E9C3C3] rounded-lg text-xs text-[#9A4E4E] flex items-center justify-between">
            <div>
              <p className="font-semibold">Unable to load employees</p>
              <p>{error}</p>
            </div>
            <button
              onClick={fetchEmployees}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white text-[#9A4E4E] border border-[#E9C3C3] font-medium hover:bg-[#F9F8FA]"
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        )}

        {loading && (
          <>
            {viewMode === "list" ? (
              <TableSkeleton rows={5} cols={6} />
            ) : (
              <CardGridSkeleton count={6} />
            )}
          </>
        )}

        {!loading && !error && employees.length === 0 && (
          <EmptyState
            icon={<Users className="w-6 h-6" />}
            title="No employees found"
            description={
              search || department || status
                ? "No employee records match your selected filter criteria. Try adjusting your filters."
                : "No employee records have been added to PeoplePay yet. Create your first employee record to get started."
            }
            actionLabel={search || department || status ? "Clear Filters" : "Add employee"}
            onAction={() => {
              if (search || department || status) {
                setSearch("");
                setDepartment("");
                setStatus("");
              }
            }}
            actionHref={search || department || status ? undefined : "/employees/new"}
          />
        )}

        {!loading && !error && employees.length > 0 && (
          <>
            {viewMode === "list" ? (
              <>
                <EmployeeTable employees={pagedEmployees} />
                <div className="flex items-center justify-between px-1 pt-1">
                  <span className="text-xs text-[#77717B]">
                    Showing {rangeStart}–{rangeEnd} of {employees.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#E8E3EA] bg-white text-xs font-medium text-[#524E57] hover:bg-[#F9F8FA] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Prev
                    </button>
                    <span className="text-xs text-[#524E57] px-2">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md border border-[#E8E3EA] bg-white text-xs font-medium text-[#524E57] hover:bg-[#F9F8FA] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Kanban Columns: ACTIVE vs INACTIVE — unchanged, unpaginated */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <div className="bg-[#F9F8FA]/80 border border-[#E8E3EA] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#5D8A6B]" />
                      <h3 className="text-xs font-bold text-[#26232A] uppercase tracking-wider">
                        Active Employees
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-[#77717B] bg-white px-2 py-0.5 rounded-full border border-[#E8E3EA]">
                      {activeEmployees.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {activeEmployees.map((emp) => (
                      <EmployeeCard key={emp.id} employee={emp} />
                    ))}
                    {activeEmployees.length === 0 && (
                      <p className="text-xs text-[#A49FA8] text-center py-6">
                        No active employees
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-[#F9F8FA]/80 border border-[#E8E3EA] rounded-lg p-3">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#B56767]" />
                      <h3 className="text-xs font-bold text-[#26232A] uppercase tracking-wider">
                        Inactive Employees
                      </h3>
                    </div>
                    <span className="text-[11px] font-semibold text-[#77717B] bg-white px-2 py-0.5 rounded-full border border-[#E8E3EA]">
                      {inactiveEmployees.length}
                    </span>
                  </div>
                  <div className="space-y-3">
                    {inactiveEmployees.map((emp) => (
                      <EmployeeCard key={emp.id} employee={emp} />
                    ))}
                    {inactiveEmployees.length === 0 && (
                      <p className="text-xs text-[#A49FA8] text-center py-6">
                        No inactive employees
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}