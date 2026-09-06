"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AlertCircle, Loader2 } from "lucide-react";

export interface SalaryRule {
  id: string;
  name: string;
  code: string;
  category: string;
  computationMethod: string;
  fixedAmount: number | null;
  percentage: number | null;
  formula: string | null;
}

interface AssignSalaryRuleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  structureId: string;
  assignedRuleIds: string[];
}

export function AssignSalaryRuleDialog({
  isOpen,
  onClose,
  onSuccess,
  structureId,
  assignedRuleIds,
}: AssignSalaryRuleDialogProps) {
  const [rules, setRules] = useState<SalaryRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [selectedRuleId, setSelectedRuleId] = useState("");
  const [sequence, setSequence] = useState("10");
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setSelectedRuleId("");
        setSequence("10");
        setError(null);
        setFetchError(null);
        setSubmitting(false);
      }, 0);

      const fetchRules = async () => {
        try {
          setLoadingRules(true);
          const token = typeof window !== "undefined" ? localStorage.getItem("peoplepay_token") : null;
          const headers: Record<string, string> = {};
          if (token) headers["Authorization"] = `Bearer ${token}`;

          const res = await fetch("/api/salary-rules", { headers });
          if (!res.ok) {
            throw new Error("Failed to fetch salary rules");
          }
          const data = await res.json();
          // Filter out already assigned rules
          const available = data.filter((r: SalaryRule) => !assignedRuleIds.includes(r.id));
          setRules(available);
          if (available.length > 0) {
            setSelectedRuleId(available[0].id);
          }
        } catch (err: unknown) {
          if (err instanceof Error) setFetchError(err.message);
          else setFetchError("Unknown error occurred");
        } finally {
          setLoadingRules(false);
        }
      };

      fetchRules();
    }
  }, [isOpen, assignedRuleIds]);

  const handleSubmit = async () => {
    if (!selectedRuleId) {
      setError("Please select a rule");
      return;
    }

    const seqVal = parseInt(sequence, 10);
    if (isNaN(seqVal) || seqVal < 0) {
      setError("Sequence must be a non-negative integer");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("peoplepay_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/salary-structures/${structureId}/rules`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          ruleId: selectedRuleId,
          sequence: seqVal,
        }),
      });

      if (!res.ok) {
        let errorMsg = "Failed to assign salary rule";
        try {
          const data = await res.json();
          if (data.error) errorMsg = data.error;
        } catch {}
        throw new Error(errorMsg);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Unknown error occurred");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={submitting ? () => {} : onClose}
      title="Assign Salary Rule"
      description="Add an existing salary rule to this structure."
      maxWidth="sm"
    >
      <div className="space-y-4">
        {fetchError && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-start">
            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}
        
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-start">
            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loadingRules ? (
          <div className="flex justify-center p-4">
            <Loader2 className="w-6 h-6 animate-spin text-[#9B7FA6]" />
          </div>
        ) : rules.length === 0 && !fetchError ? (
          <div className="p-4 bg-yellow-50 text-yellow-700 text-sm rounded-md border border-yellow-200">
            All available salary rules are already assigned to this structure.
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-[#26232A] mb-1">
                Salary Rule <span className="text-red-500">*</span>
              </label>
              <Select
                value={selectedRuleId}
                onChange={(e) => setSelectedRuleId(e.target.value)}
                disabled={submitting}
                options={[
                  ...rules.map((r) => ({
                    label: `${r.name} (${r.code})`,
                    value: r.id,
                  }))
                ]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#26232A] mb-1">
                Sequence <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={sequence}
                onChange={(e) => setSequence(e.target.value)}
                placeholder="10"
                disabled={submitting}
              />
              <p className="mt-1 text-xs text-[#77717B]">
                Determines the order of calculation (lower numbers run first).
              </p>
            </div>
          </>
        )}

        <div className="flex justify-end pt-4 gap-2 border-t border-[#E8E3EA] mt-6">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting || rules.length === 0 || loadingRules || !selectedRuleId}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Assigning...
              </>
            ) : (
              "Assign Rule"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
