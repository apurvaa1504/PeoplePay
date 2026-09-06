"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AlertCircle, Loader2 } from "lucide-react";

interface SalaryRuleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function SalaryRuleDialog({ isOpen, onClose, onSuccess }: SalaryRuleDialogProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("BASIC");
  const [method, setMethod] = useState("FIXED");
  
  const [fixedAmount, setFixedAmount] = useState("");
  const [percentage, setPercentage] = useState("");
  const [formula, setFormula] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setName("");
        setCode("");
        setCategory("BASIC");
        setMethod("FIXED");
        setFixedAmount("");
        setPercentage("");
        setFormula("");
        setError(null);
        setSubmitting(false);
      }, 0);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toUpperCase();

    if (!trimmedName || !trimmedCode) {
      setError("Name and Code are required");
      return;
    }

    const payload: Record<string, unknown> = {
      name: trimmedName,
      code: trimmedCode,
      category,
      computationMethod: method,
    };

    if (method === "FIXED") {
      const val = parseFloat(fixedAmount);
      if (isNaN(val) || val < 0) {
        setError("Valid fixed amount is required");
        return;
      }
      payload.fixedAmount = val;
    } else if (method === "PERCENTAGE") {
      const val = parseFloat(percentage);
      if (isNaN(val) || val < 0) {
        setError("Valid percentage is required");
        return;
      }
      payload.percentage = val;
      if (formula.trim()) {
        payload.formula = formula.trim();
      }
    } else if (method === "FORMULA") {
      if (!formula.trim()) {
        setError("Formula is required");
        return;
      }
      payload.formula = formula.trim();
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("peoplepay_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/salary-rules", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let errorMsg = "Failed to create salary rule";
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
      title="New Salary Rule"
      description="Create a new salary rule for your structures."
      maxWidth="md"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-start">
            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#26232A] mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. House Rent Allowance"
              disabled={submitting}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#26232A] mb-1">
              Code <span className="text-red-500">*</span>
            </label>
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. HRA"
              disabled={submitting}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#26232A] mb-1">
              Category
            </label>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={submitting}
              options={[
                { label: "Basic", value: "BASIC" },
                { label: "Allowance", value: "ALLOWANCE" },
                { label: "Gross", value: "GROSS" },
                { label: "Deduction", value: "DEDUCTION" },
                { label: "Net", value: "NET" },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#26232A] mb-1">
              Method
            </label>
            <Select
              value={method}
              onChange={(e) => {
                setMethod(e.target.value);
                setFixedAmount("");
                setPercentage("");
                setFormula("");
              }}
              disabled={submitting}
              options={[
                { label: "Fixed Amount", value: "FIXED" },
                { label: "Percentage", value: "PERCENTAGE" },
                { label: "Formula", value: "FORMULA" },
              ]}
            />
          </div>
        </div>

        {method === "FIXED" && (
          <div>
            <label className="block text-sm font-medium text-[#26232A] mb-1">
              Fixed Amount (₹) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={fixedAmount}
              onChange={(e) => setFixedAmount(e.target.value)}
              placeholder="0.00"
              disabled={submitting}
            />
          </div>
        )}

        {method === "PERCENTAGE" && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#26232A] mb-1">
                Percentage (%) <span className="text-red-500">*</span>
              </label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                placeholder="40"
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#26232A] mb-1">
                Base Reference (Formula)
              </label>
              <Input
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="e.g. BASIC"
                disabled={submitting}
              />
            </div>
          </div>
        )}

        {method === "FORMULA" && (
          <div>
            <label className="block text-sm font-medium text-[#26232A] mb-1">
              Formula <span className="text-red-500">*</span>
            </label>
            <Input
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="e.g. BASIC + HRA"
              disabled={submitting}
            />
          </div>
        )}

        <div className="flex justify-end pt-4 gap-2 border-t border-[#E8E3EA] mt-6">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim() || !code.trim()}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Rule"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
