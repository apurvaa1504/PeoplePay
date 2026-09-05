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
import { Plus, Users, RefreshCw } from "lucide-react";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");

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
    } catch (err: any) {
      setError(err.message || "Something went wrong while retrieving employee records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [department, status]);

  // Handle live search with simple debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEmployees();
    }, 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Collect unique departments
  const uniqueDepartments = Array.from(
    new Set(employees.map((e) => e.department).filter(Boolean) as string[])
  );

  const activeEmployees = employees.filter((e) => e.status === "ACTIVE");
  const inactiveEmployees = employees.filter((e) => e.status === "INACTIVE");

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
        {/* Header Description */}
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

        {/* Filters */}
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

        {/* Error Banner */}
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

        {/* Loading Skeleton */}
        {loading && (
          <>
            {viewMode === "list" ? (
              <TableSkeleton rows={5} cols={6} />
            ) : (
              <CardGridSkeleton count={6} />
            )}
          </>
        )}

        {/* Empty State */}
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

        {/* Data View */}
        {!loading && !error && employees.length > 0 && (
          <>
            {viewMode === "list" ? (
              <EmployeeTable employees={employees} />
            ) : (
              /* Kanban Columns: ACTIVE vs INACTIVE */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Active Column */}
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

                {/* Inactive Column */}
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
