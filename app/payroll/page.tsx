"use client";

import React, { useState, useMemo, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { PayrunTable, PayrunItem, PayrunStatus } from "@/components/payroll/PayrunTable";
import { NewPayrunDialog } from "@/components/payroll/NewPayrunDialog";
import { Plus, Search, Filter, CreditCard, RefreshCw, AlertCircle } from "lucide-react";

export default function PayrollPage() {
  const [payruns, setPayruns] = useState<PayrunItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  const fetchPayruns = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = typeof window !== "undefined" ? localStorage.getItem("peoplepay_token") : null;
      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/payruns", { headers });
      if (!res.ok) {
        throw new Error("Failed to fetch payruns");
      }
      const data = await res.json();

      const formatted = data.map((p: PayrunItem & { structure?: { name: string } }) => ({
        id: p.id,
        name: p.name,
        structureId: p.structureId,
        structureName: p.structure?.name,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        status: p.status,
        createdAt: p.createdAt,
      }));
      setPayruns(formatted);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPayruns();
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const filteredPayruns = useMemo(() => {
    return payruns.filter((p) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.structureName &&
          p.structureName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "" || p.status === (statusFilter as PayrunStatus);

      return matchesSearch && matchesStatus;
    });
  }, [payruns, searchQuery, statusFilter]);

  const handleSimulateRefresh = () => {
    fetchPayruns();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("");
  };

  return (
    <AppShell
      breadcrumbs={[{ label: "Operations" }, { label: "Payroll" }]}
      title="Payroll & Payruns"
      actions={
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSimulateRefresh}
            title="Refresh List"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#77717B]" />
          </Button>
          <Button
            size="sm"
            onClick={() => setIsWizardOpen(true)}
          >
            <Plus className="w-4 h-4" />
            <span>New Payrun</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Filter and Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E8E3EA] shadow-2xs">
          <div className="flex flex-1 items-center gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A49FA8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search payruns or structures..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border border-[#E8E3EA] bg-[#FCFBFD] text-[#26232A] placeholder-[#A49FA8] focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 transition-all"
              />
            </div>

            {/* Status Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#A49FA8] shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-[#E8E3EA] bg-[#FCFBFD] px-2.5 py-1.5 text-xs text-[#524E57] focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="DRAFT">Draft</option>
                <option value="COMPUTED">Computed</option>
                <option value="VALIDATED">Validated</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
          </div>

          <div className="text-xs text-[#77717B] font-medium">
            Showing <span className="font-semibold text-[#26232A]">{filteredPayruns.length}</span> of{" "}
            {payruns.length} payruns
          </div>
        </div>

        {/* Content Section: Loading | Error | Empty | Data Table */}
        {loading ? (
          <TableSkeleton rows={4} cols={6} />
        ) : error ? (
          <EmptyState
            icon={<AlertCircle className="w-6 h-6 text-red-500" />}
            title="Error loading payruns"
            description={error}
            actionLabel="Try Again"
            onAction={fetchPayruns}
          />
        ) : filteredPayruns.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="w-6 h-6" />}
            title="No payruns found"
            description={
              searchQuery || statusFilter
                ? "No payruns match your selected filters. Try adjusting your query or clear filters."
                : "No payruns have been recorded yet. Click 'New Payrun' to initialize salary generation for a period."
            }
            actionLabel={searchQuery || statusFilter ? "Clear Filters" : "New Payrun"}
            onAction={
              searchQuery || statusFilter
                ? handleClearFilters
                : () => setIsWizardOpen(true)
            }
          />
        ) : (
          <PayrunTable payruns={filteredPayruns} />
        )}
      </div>

      <NewPayrunDialog
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        onSuccess={() => fetchPayruns()}
      />
    </AppShell>
  );
}
