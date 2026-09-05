"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmployeeRecord } from "@/lib/types";

interface ContractFormProps {
  employees: EmployeeRecord[];
  preselectedEmployeeId?: string;
}

export function ContractForm({
  employees,
  preselectedEmployeeId,
}: ContractFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    employeeId: preselectedEmployeeId || employees[0]?.id || "",
    startDate: "",
    endDate: "",
    wage: "",
    department: "",
    jobPosition: "",
    structureId: "struct-standard",
    status: "ACTIVE",
  });

  React.useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      startDate: prev.startDate || new Date().toISOString().split("T")[0],
      employeeId: prev.employeeId || preselectedEmployeeId || employees[0]?.id || "",
    }));
  }, [employees, preselectedEmployeeId]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId || !formData.startDate || !formData.wage) {
      setError("Please fill in all required fields (Employee, Start Date, Wage).");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/contracts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          wage: Number(formData.wage),
          endDate: formData.endDate || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create contract");
      }

      router.push("/contracts");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const employeeOptions = employees.map((e) => ({
    value: e.id,
    label: `${e.firstName} ${e.lastName} — ${e.jobPosition || e.department || "Employee"}`,
  }));

  const statusOptions = [
    { value: "ACTIVE", label: "Active" },
    { value: "DRAFT", label: "Draft" },
    { value: "EXPIRED", label: "Expired" },
  ];

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 max-w-2xl bg-white p-6 rounded-lg border border-[#E8E3EA] shadow-2xs"
    >
      {error && (
        <div className="p-3 bg-[#FAECEC] border border-[#E9C3C3] rounded-md text-xs text-[#9A4E4E]">
          <p className="font-semibold">Business Rule Alert</p>
          <p>{error}</p>
        </div>
      )}

      {/* Contract Terms */}
      <div className="space-y-4">
        <div className="border-b border-[#E8E3EA] pb-2">
          <h3 className="text-sm font-semibold text-[#26232A]">Contract Details</h3>
          <p className="text-xs text-[#77717B]">
            Employment terms, compensation, and schedule integration.
          </p>
        </div>

        <Select
          label="Employee"
          value={formData.employeeId}
          options={employeeOptions}
          onChange={(e) => {
            const emp = employees.find((x) => x.id === e.target.value);
            setFormData({
              ...formData,
              employeeId: e.target.value,
              department: emp?.department || formData.department,
              jobPosition: emp?.jobPosition || formData.jobPosition,
            });
          }}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Start Date"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            required
          />
          <Input
            label="End Date (Optional)"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            helperText="Leave empty for permanent / open-ended"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Annual Wage / Salary ($)"
            type="number"
            placeholder="e.g. 85000"
            value={formData.wage}
            onChange={(e) => setFormData({ ...formData, wage: e.target.value })}
            required
          />
          <Select
            label="Contract Status"
            value={formData.status}
            options={statusOptions}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Department"
            placeholder="e.g. Engineering"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />
          <Input
            label="Job Position"
            placeholder="e.g. Lead Architect"
            value={formData.jobPosition}
            onChange={(e) => setFormData({ ...formData, jobPosition: e.target.value })}
          />
        </div>

        <Input
          label="Salary Structure Code"
          placeholder="e.g. struct-standard"
          value={formData.structureId}
          onChange={(e) => setFormData({ ...formData, structureId: e.target.value })}
          helperText="Person 3 Payroll Structure identifier"
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
          Create Contract
        </Button>
      </div>
    </form>
  );
}
