"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmployeeRecord } from "@/lib/types";

interface AttendanceFormProps {
  employees: EmployeeRecord[];
}

export function AttendanceForm({ employees }: AttendanceFormProps) {
  const router = useRouter();
  const now = new Date();
  const defaultCheckIn = new Date(now.setHours(9, 0, 0, 0)).toISOString().slice(0, 16);
  const defaultCheckOut = new Date(now.setHours(17, 0, 0, 0)).toISOString().slice(0, 16);

  const [formData, setFormData] = useState({
    employeeId: employees[0]?.id || "",
    checkIn: defaultCheckIn,
    checkOut: defaultCheckOut,
    status: "PRESENT",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-2xl bg-white p-6 rounded-lg border border-[#E8E3EA] shadow-2xs"
    >
      {error && (
        <div className="p-3 bg-[#FAECEC] border border-[#E9C3C3] rounded-md text-xs text-[#9A4E4E]">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="border-b border-[#E8E3EA] pb-2">
          <h3 className="text-sm font-semibold text-[#26232A]">Attendance Log</h3>
          <p className="text-xs text-[#77717B]">
            Record employee shift attendance. Worked hours will be automatically derived from timestamps.
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
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={loading}>
          Record Attendance
        </Button>
      </div>
    </form>
  );
}
