"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ContractForm } from "@/components/contracts/ContractForm";
import { EmployeeRecord } from "@/lib/types";

export default function NewContractPage() {
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
        console.error("Failed to load employees for contract creation", err);
      }
    }
    loadEmployees();
  }, []);

  return (
    <AppShell
      breadcrumbs={[
        { label: "People", href: "/employees" },
        { label: "Contracts", href: "/contracts" },
        { label: "New Contract" },
      ]}
      title="Create Contract Agreement"
    >
      <div className="space-y-4">
        <div>
          <p className="text-xs text-[#77717B]">
            Draft or activate employment agreements. Overlapping active contracts for the same employee are automatically flagged and prevented.
          </p>
        </div>
        <ContractForm employees={employees} />
      </div>
    </AppShell>
  );
}
