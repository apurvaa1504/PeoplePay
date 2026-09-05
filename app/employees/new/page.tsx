"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { EmployeeForm } from "@/components/employees/EmployeeForm";
import { EmployeeRecord, WorkingScheduleRecord } from "@/lib/types";

export default function NewEmployeePage() {
  const [managers, setManagers] = useState<EmployeeRecord[]>([]);
  const [schedules, setSchedules] = useState<WorkingScheduleRecord[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [empRes, schedRes] = await Promise.all([
          fetch("/api/employees"),
          fetch("/api/schedules"),
        ]);
        if (empRes.ok) {
          const empData = await empRes.json();
          setManagers(empData);
        }
        if (schedRes.ok) {
          const schedData = await schedRes.json();
          setSchedules(schedData);
        }
      } catch (err) {
        console.error("Failed to load options", err);
      }
    }
    loadData();
  }, []);

  return (
    <AppShell
      breadcrumbs={[
        { label: "People", href: "/employees" },
        { label: "Employees", href: "/employees" },
        { label: "New Employee" },
      ]}
      title="Create New Employee"
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-[#77717B]">
            Add a new employee record to PeoplePay. You can assign contracts, schedules, and track attendance once registered.
          </p>
        </div>
        <EmployeeForm managers={managers} schedules={schedules} />
      </div>
    </AppShell>
  );
}
