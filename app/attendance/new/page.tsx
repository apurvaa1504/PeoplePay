"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AttendanceForm } from "@/components/attendance/AttendanceForm";
import { EmployeeRecord } from "@/lib/types";

export default function NewAttendancePage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const res = await fetch("/api/employees");
        if (res.ok) {
          const data = await res.json();
          setEmployees(data);
        }
      } catch (err) {
        console.error("Failed to load employees for attendance", err);
      }
    }
    loadEmployees();
  }, []);

  return (
    <AppShell
      breadcrumbs={[
        { label: "Operations", href: "/attendance" },
        { label: "Attendance", href: "/attendance" },
        { label: "Record Entry" },
      ]}
      title="Record Attendance"
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-[#77717B]">
            Log a new check-in and check-out timestamp. Worked hours will be automatically calculated.
          </p>
        </div>
        <AttendanceForm employees={employees} />
      </div>
    </AppShell>
  );
}
