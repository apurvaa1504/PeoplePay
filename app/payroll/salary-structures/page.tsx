"use client";

import React, { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { SalaryStructureTable, SalaryStructure } from "@/components/payroll/SalaryStructureTable";
import { SalaryStructureDialog } from "@/components/payroll/SalaryStructureDialog";
import { SalaryStructureRules } from "@/components/payroll/SalaryStructureRules";
import { Plus, Loader2, AlertCircle } from "lucide-react";

export default function SalaryStructuresPage() {
  const [structures, setStructures] = useState<SalaryStructure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [isNewStructureOpen, setIsNewStructureOpen] = useState(false);

  const [userRole, setUserRole] = useState<string | null>(null);

  const fetchStructures = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = typeof window !== "undefined" ? localStorage.getItem("peoplepay_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/salary-structures", { headers });
      if (!res.ok) {
        throw new Error("Failed to fetch salary structures");
      }
      
      const data = await res.json();
      setStructures(data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Try to get role from user object if it exists to gracefully disable buttons
    // The backend still enforces auth fully.
    const timer = setTimeout(() => {
      try {
        const userStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user && user.role) {
            setUserRole(user.role);
          }
        }
      } catch {
        // Ignore parse errors
      }

      fetchStructures();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const canManage = userRole !== "HR_PAYROLL_USER";
  
  const selectedStructure = useMemo(() => {
    if (!selectedStructureId) return null;
    return structures.find(s => s.id === selectedStructureId) || null;
  }, [selectedStructureId, structures]);

  const handleStructureCreated = (newStructure: SalaryStructure) => {
    setStructures(prev => [...prev, newStructure]);
    setSelectedStructureId(newStructure.id);
  };

  return (
    <AppShell
      breadcrumbs={[
        { label: "Operations" },
        { label: "Payroll", href: "/payroll" },
        { label: "Salary Structures" },
      ]}
      title="Salary Structures"
      actions={
        <Button
          onClick={() => setIsNewStructureOpen(true)}
          disabled={!canManage}
          title={!canManage ? "You do not have permission to create structures" : ""}
        >
          <Plus className="w-4 h-4 mr-2" />
          New Structure
        </Button>
      }
    >
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-medium text-[#77717B] mb-4">
            Configure salary structures and the rules used to calculate payroll.
          </h2>
        </div>

        {error && (
          <div className="p-4 bg-red-50 text-red-600 text-sm rounded-md flex items-start border border-red-200">
            <AlertCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-[#E8E3EA] shadow-2xs p-4 mb-4">
              <h3 className="font-semibold text-[#26232A] mb-1">Structures</h3>
              <p className="text-xs text-[#77717B] mb-4">Select a structure to view its rules</p>
              
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-[#9B7FA6]" />
                </div>
              ) : (
                <SalaryStructureTable
                  structures={structures}
                  selectedId={selectedStructureId}
                  onSelect={(s) => setSelectedStructureId(s.id)}
                />
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedStructure ? (
              <SalaryStructureRules
                structureId={selectedStructure.id}
                structureName={selectedStructure.name}
                isActive={selectedStructure.active}
                canManage={canManage}
              />
            ) : (
              <div className="h-64 border border-dashed border-[#E8E3EA] rounded-lg bg-[#FAFAFB] flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 rounded-full bg-[#F1EBF3] flex items-center justify-center mb-3">
                  <AlertCircle className="w-6 h-6 text-[#9B7FA6]" />
                </div>
                <h3 className="text-sm font-medium text-[#26232A]">No structure selected</h3>
                <p className="mt-1 text-xs text-[#77717B] max-w-xs">
                  Select a salary structure from the list to view and manage its assigned salary rules.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <SalaryStructureDialog
        isOpen={isNewStructureOpen}
        onClose={() => setIsNewStructureOpen(false)}
        onSuccess={handleStructureCreated}
      />
    </AppShell>
  );
}
