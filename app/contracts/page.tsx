"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ContractTable } from "@/components/contracts/ContractTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { ContractRecord } from "@/lib/types";
import { Plus, FileText, Filter } from "lucide-react";

function ContractsContent() {
  const searchParams = useSearchParams();
  const employeeFilter = searchParams.get("employeeId") || "";

  const [contracts, setContracts] = useState<ContractRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchContracts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (employeeFilter) params.append("employeeId", employeeFilter);
      if (statusFilter) params.append("status", statusFilter);

      const res = await fetch(`/api/contracts?${params.toString()}`);
      if (!res.ok) throw new Error("Could not load contracts.");
      const data = await res.json();
      setContracts(data);
    } catch (err: any) {
      setError(err.message || "Failed to load contracts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [employeeFilter, statusFilter]);

  return (
    <div className="space-y-4">
      {/* Header Description & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E8E3EA] shadow-2xs">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#A49FA8]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-[#E8E3EA] bg-[#FCFBFD] px-2.5 py-1.5 text-xs text-[#524E57] focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 cursor-pointer"
          >
            <option value="">All Contract Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="DRAFT">Draft</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>

        {employeeFilter && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#77717B]">Filtering by Employee:</span>
            <span className="font-semibold text-[#71547D] bg-[#F1EBF3] px-2 py-0.5 rounded">
              ID: {employeeFilter.slice(0, 8)}
            </span>
            <Link
              href="/contracts"
              className="text-[#B56767] hover:underline text-[11px]"
            >
              Clear filter
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-[#FAECEC] border border-[#E9C3C3] rounded-lg text-xs text-[#9A4E4E]">
          {error}
        </div>
      )}

      {loading && <TableSkeleton rows={4} cols={8} />}

      {!loading && !error && contracts.length === 0 && (
        <EmptyState
          icon={<FileText className="w-6 h-6" />}
          title="No contracts found"
          description="No contract agreements have been added yet. Create a contract to link wage, salary structure, and active terms to an employee."
          actionLabel="New Contract"
          actionHref="/contracts/new"
        />
      )}

      {!loading && !error && contracts.length > 0 && (
        <ContractTable contracts={contracts} />
      )}
    </div>
  );
}

export default function ContractsPage() {
  return (
    <AppShell
      breadcrumbs={[{ label: "People" }, { label: "Contracts" }]}
      title="Contracts"
      actions={
        <Link
          href="/contracts/new"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#9B7FA6] hover:bg-[#886B94] text-white text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>New Contract</span>
        </Link>
      }
    >
      <Suspense fallback={<TableSkeleton rows={4} cols={8} />}>
        <ContractsContent />
      </Suspense>
    </AppShell>
  );
}
