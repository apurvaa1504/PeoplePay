"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { AttendanceForm } from "@/components/attendance/AttendanceForm";
import { EmployeeRecord } from "@/lib/types";

export default function NewAttendancePage() {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<EmployeeRecord | null>(null);

  const [isEmployeeRole, setIsEmployeeRole] = useState(false);

  useEffect(() => {
    async function loadEmployees() {
      try {
        const stored = localStorage.getItem("user");
        const parsed = stored ? JSON.parse(stored) : null;
        const isEmployee = parsed?.role === "EMPLOYEE";
        setIsEmployeeRole(isEmployee);

        if (isEmployee && parsed?.employeeId) {
          const res = await fetch(`/api/employees/${parsed.employeeId}`);
          if (res.ok) {
            const emp = await res.json();
            setCurrentEmployee(emp);
            setEmployees([emp]);
            return;
          }
        }

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
        { label: isEmployeeRole ? "Shift Punch Clock" : "Record Entry" },
      ]}
      title={isEmployeeRole ? "Attendance Punch Clock" : "Record Attendance"}
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-[#77717B]">
            {isEmployeeRole
              ? "Check in and check out with real-time timestamps to accurately compute and record your shift work hours."
              : "Log a new check-in and check-out timestamp. Worked hours will be automatically calculated."}
          </p>
        </div>
        <AttendanceForm employees={employees} currentEmployee={currentEmployee} />
      </div>
    </AppShell>
  );
}
