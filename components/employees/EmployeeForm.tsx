"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmployeeRecord, WorkingScheduleRecord } from "@/lib/types";

interface EmployeeFormProps {
  initialData?: Partial<EmployeeRecord>;
  managers: EmployeeRecord[];
  schedules: WorkingScheduleRecord[];
  isEdit?: boolean;
}

export function EmployeeForm({
  initialData,
  managers,
  schedules,
  isEdit = false,
}: EmployeeFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: initialData?.firstName || "",
    lastName: initialData?.lastName || "",
    department: initialData?.department || "Engineering",
    jobPosition: initialData?.jobPosition || "",
    status: initialData?.status || "ACTIVE",
    managerId: initialData?.managerId || "",
    scheduleId: initialData?.scheduleId || (schedules[0]?.id ?? ""),
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      setError("First name and last name are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = isEdit && initialData?.id ? `/api/employees/${initialData.id}` : "/api/employees";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          managerId: formData.managerId || null,
          scheduleId: formData.scheduleId || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save employee");
      }

      router.push("/employees");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const managerOptions = [
    { value: "", label: "None (Direct Report / Executive)" },
    ...managers
      .filter((m) => !initialData?.id || m.id !== initialData.id)
      .map((m) => ({
        value: m.id,
        label: `${m.firstName} ${m.lastName} (${m.jobPosition || m.department || "Staff"})`,
      })),
  ];

  const scheduleOptions = [
    { value: "", label: "No Schedule Assigned" },
    ...schedules.map((s) => ({
      value: s.id,
      label: `${s.name} (${s.weeklyHours} hrs/week)`,
    })),
  ];

  const departmentOptions = [
    { value: "Engineering", label: "Engineering" },
    { value: "Product", label: "Product" },
    { value: "Design", label: "Design" },
    { value: "Human Resources", label: "Human Resources" },
    { value: "Finance & Accounting", label: "Finance & Accounting" },
    { value: "Sales & Marketing", label: "Sales & Marketing" },
    { value: "Operations", label: "Operations" },
  ];

  const statusOptions = [
    { value: "ACTIVE", label: "Active" },
    { value: "INACTIVE", label: "Inactive" },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white p-6 rounded-lg border border-[#E8E3EA] shadow-2xs">
      {/* Smart Action Buttons when editing an existing employee */}
      {isEdit && initialData?.id && (
        <div className="flex flex-wrap items-center gap-2 pb-4 border-b border-[#E8E3EA]">
          <span className="text-[11px] font-semibold text-[#77717B] uppercase tracking-wider mr-1">
            Linked Records:
          </span>
          <a
            href={`/contracts?employeeId=${initialData.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#F1EBF3] hover:bg-[#E8DFEC] text-[#71547D] text-xs font-semibold transition-colors"
          >
            <span>Contracts</span>
          </a>
          <a
            href={`/attendance?employeeId=${initialData.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#EDF4EE] hover:bg-[#E1EDE3] text-[#3D6B49] text-xs font-semibold transition-colors"
          >
            <span>Attendance</span>
          </a>
          <a
            href={`/time-off?employeeId=${initialData.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#EDF2F7] hover:bg-[#E1E8F0] text-[#4F6785] text-xs font-semibold transition-colors"
          >
            <span>Time Off</span>
          </a>
        </div>
      )}

      {error && (
        <div className="p-3 bg-[#FAECEC] border border-[#E9C3C3] rounded-md text-xs text-[#9A4E4E]">
          {error}
        </div>
      )}

      {/* Section 1: Basic Information */}
      <div className="space-y-4">
        <div className="border-b border-[#E8E3EA] pb-2">
          <h3 className="text-sm font-semibold text-[#26232A]">Basic Information</h3>
          <p className="text-xs text-[#77717B]">Personal name and identification details.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            placeholder="e.g. Jane"
            required
          />
          <Input
            label="Last Name"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="e.g. Doe"
            required
          />
        </div>
      </div>

      {/* Section 2: Work Information */}
      <div className="space-y-4 pt-2">
        <div className="border-b border-[#E8E3EA] pb-2">
          <h3 className="text-sm font-semibold text-[#26232A]">Work Information</h3>
          <p className="text-xs text-[#77717B]">Department, organizational hierarchy, and schedule.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Department"
            value={formData.department}
            options={departmentOptions}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
          <Input
            label="Job Position"
            value={formData.jobPosition}
            onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
            placeholder="e.g. Senior Software Engineer"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Manager"
            value={formData.managerId}
            options={managerOptions}
            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
          />
          <Select
            label="Working Schedule"
            value={formData.scheduleId}
            options={scheduleOptions}
            onChange={(e) => setFormData({ ...formData, scheduleId: e.target.value })}
          />
        </div>

        <div>
          <Select
            label="Employment Status"
            value={formData.status}
            options={statusOptions}
            onChange={(e) => setFormData({ ...formData, status: e.target.value as "ACTIVE" | "INACTIVE" })}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8E3EA]">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={loading}
        >
          {isEdit ? "Save Changes" : "Save Employee"}
        </Button>
      </div>
    </form>
  );
}
