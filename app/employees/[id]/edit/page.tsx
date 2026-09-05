"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmployeeRecord, WorkingScheduleRecord } from "@/lib/types";

export default function EditEmployeePage() {
  const params = useParams();
  const id = params?.id as string;

  const [employee, setEmployee] = useState<EmployeeRecord | null>(null);
  const [managers, setManagers] = useState<EmployeeRecord[]>([]);
  const [schedules, setSchedules] = useState<WorkingScheduleRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [empDetailRes, empsRes, schedRes] = await Promise.all([
          fetch(`/api/employees/${id}`),
          fetch("/api/employees"),
          fetch("/api/schedules"),
        ]);

        if (empDetailRes.ok) {
          const detail = await empDetailRes.json();
          setEmployee(detail);
        }
        if (empsRes.ok) {
          const emps = await empsRes.json();
          setManagers(emps);
        }
        if (schedRes.ok) {
          const scheds = await schedRes.json();
          setSchedules(scheds);
        }
      } catch (err) {
        console.error("Failed to load employee edit data", err);
      } finally {
        setLoading(false);
      }
    }
    if (id) loadData();
  }, [id]);

  return (
    <AppShell
      breadcrumbs={[
        { label: "People", href: "/employees" },
        { label: "Employees", href: "/employees" },
        { label: employee ? `${employee.firstName} ${employee.lastName}` : "Employee", href: `/employees/${id}` },
        { label: "Edit" },
      ]}
      title="Edit Employee Profile"
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-[#77717B]">
            Update organizational information, department, position, or employment status.
          </p>
        </div>

        {loading ? (
          <Skeleton className="h-96 max-w-2xl" />
        ) : employee ? (
          <EmployeeForm
            initialData={employee}
            managers={managers}
            schedules={schedules}
            isEdit
          />
        ) : (
          <p className="text-xs text-[#B56767]">Employee not found.</p>
        )}
      </div>
    </AppShell>
  );
}
