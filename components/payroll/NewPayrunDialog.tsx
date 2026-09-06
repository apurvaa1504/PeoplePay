"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmployeeSelectionStep, EligibleEmployee } from "./EmployeeSelectionStep";
import { AlertCircle, Loader2 } from "lucide-react";

interface NewPayrunDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewPayrunDialog({ isOpen, onClose, onSuccess }: NewPayrunDialogProps) {
  const [step, setStep] = useState(1);
  const [structures, setStructures] = useState<{ id: string; name: string }[]>([]);
  const [fetchingStructures, setFetchingStructures] = useState(false);

  // Form State
  const [structureId, setStructureId] = useState("");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  
  // Step 2 State
  const [employees, setEmployees] = useState<EligibleEmployee[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [fetchingEmployees, setFetchingEmployees] = useState(false);
  const [employeeError, setEmployeeError] = useState<string | null>(null);

  // Execution State
  const [executing, setExecuting] = useState(false);
  const [executeError, setExecuteError] = useState<string | null>(null);
  const [executeWarnings, setExecuteWarnings] = useState<string[]>([]);
  const [createdPayrunId, setCreatedPayrunId] = useState<string | null>(null);
  const [structureError, setStructureError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setStep(1);
        setStructureId("");
        setPeriodStart("");
        setPeriodEnd("");
        setEmployees([]);
        setSelectedEmployeeIds([]);
        setExecuteError(null);
        setExecuteWarnings([]);
        setCreatedPayrunId(null);
        setStructureError(null);
      }, 0);
      
      const fetchStructures = async () => {
        try {
          setFetchingStructures(true);
          const token =
            typeof window !== "undefined"
              ? localStorage.getItem("peoplepay_token") || localStorage.getItem("token")
              : null;
          const headers: Record<string, string> = {};
          if (token) headers["Authorization"] = `Bearer ${token}`;

          const res = await fetch("/api/salary-structures", { headers });
          if (!res.ok) {
            throw new Error("Failed to fetch salary structures");
          }
          const data = await res.json();
          // only active
          setStructures(data.filter((s: Record<string, unknown>) => s.active));
        } catch (err: unknown) {
          console.error(err);
          if (err instanceof Error) {
            setStructureError(err.message);
          } else {
            setStructureError("Unknown error occurred");
          }
        } finally {
          setFetchingStructures(false);
        }
      };

      fetchStructures();
    }
  }, [isOpen]);

  const handleNextStep = async () => {
    if (!structureId || !periodStart || !periodEnd) return;
    
    const start = new Date(periodStart).getTime();
    const end = new Date(periodEnd).getTime();
    if (start > end) {
      alert("Period Start cannot be after Period End");
      return;
    }

    setStep(2);
    setFetchingEmployees(true);
    setEmployeeError(null);
    setSelectedEmployeeIds([]);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("peoplepay_token") || localStorage.getItem("token")
          : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const params = new URLSearchParams({ structureId, periodStart, periodEnd });
      const res = await fetch(`/api/payruns/eligible-employees?${params.toString()}`, { headers });
      if (!res.ok) {
        throw new Error("Failed to fetch eligible employees");
      }
      
      const data = await res.json();
      setEmployees(data);
      // Auto-select all by default to make it easy
      setSelectedEmployeeIds(data.map((e: Record<string, unknown>) => e.id as string));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setEmployeeError(err.message);
      } else {
        setEmployeeError("Unknown error occurred");
      }
    } finally {
      setFetchingEmployees(false);
    }
  };

  const handleCreate = async () => {
    if (selectedEmployeeIds.length === 0) return;

    setExecuting(true);
    setExecuteError(null);
    setExecuteWarnings([]);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("peoplepay_token") || localStorage.getItem("token")
          : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      // 1. Create Payrun
      const createRes = await fetch("/api/payruns", {
        method: "POST",
        headers,
        body: JSON.stringify({ structureId, periodStart, periodEnd }),
      });

      if (!createRes.ok) {
        const errData = await createRes.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to create payrun");
      }

      const createdPayrun = await createRes.json();
      setCreatedPayrunId(createdPayrun.id);

      // 2. Compute Payrun
      const computeRes = await fetch(`/api/payruns/${createdPayrun.id}/compute`, {
        method: "POST",
        headers,
        body: JSON.stringify({ employeeIds: selectedEmployeeIds }),
      });

      if (!computeRes.ok) {
        const errData = await computeRes.json().catch(() => ({}));
        const warn = errData.warnings?.join(", ") || "";
        throw new Error(`Creation succeeded, but computation failed: ${errData.error || "Unknown error"}. ${warn}`);
      }

      const computeData = await computeRes.json();
      
      if (computeData.warnings && Array.isArray(computeData.warnings) && computeData.warnings.length > 0) {
        // Show warnings but still succeed
        setExecuteWarnings(computeData.warnings);
      } else {
        onSuccess();
        onClose();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setExecuteError(err.message);
      } else {
        setExecuteError("Unknown error occurred");
      }
    } finally {
      setExecuting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={executing ? () => {} : onClose}
      title="Create New Payrun"
      description={step === 1 ? "Select structure and date range" : "Select eligible employees for this payrun"}
      maxWidth="lg"
    >
      {step === 1 && (
        <div className="space-y-4">
          {structureError && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{structureError}</span>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[#26232A] mb-1">
              Salary Structure
            </label>
            <Select
              value={structureId}
              onChange={(e) => setStructureId(e.target.value)}
              disabled={fetchingStructures}
              options={[
                { label: "Select a structure", value: "" },
                ...structures.map((s) => ({ label: s.name, value: s.id }))
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#26232A] mb-1">
                Period Start
              </label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#26232A] mb-1">
                Period End
              </label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleNextStep}
              disabled={!structureId || !periodStart || !periodEnd}
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col max-h-[70vh]">
          <div className="min-h-0 flex-1 max-h-[360px] overflow-hidden flex flex-col">
            <EmployeeSelectionStep
              employees={employees}
              selectedEmployeeIds={selectedEmployeeIds}
              onChange={setSelectedEmployeeIds}
              loading={fetchingEmployees}
              error={employeeError}
            />
          </div>

          {executeError && (
            <div className="mt-4 p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold mb-1">Process Error</p>
                <p>{executeError}</p>
                {createdPayrunId && (
                  <p className="mt-2 text-xs font-medium bg-red-100/50 p-1.5 rounded text-red-700">
                    Payrun successfully created (ID: <span className="font-mono">{createdPayrunId}</span>) but computation failed.
                  </p>
                )}
              </div>
            </div>
          )}

          {executeWarnings.length > 0 && !executeError && (
            <div className="mt-4 p-3 bg-yellow-50 text-yellow-700 text-sm rounded-md">
              <p className="font-semibold mb-1">Generated with warnings:</p>
              <ul className="list-disc pl-4 space-y-1">
                {executeWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
              <Button size="sm" variant="secondary" className="mt-3" onClick={() => { onSuccess(); onClose(); }}>
                Acknowledge & Close
              </Button>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 mt-auto border-t border-[#E8E3EA]">
            <Button variant="secondary" onClick={() => setStep(1)} disabled={executing}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={onClose} disabled={executing}>
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={executing || selectedEmployeeIds.length === 0 || fetchingEmployees}
              >
                {executing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Create Payrun"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
