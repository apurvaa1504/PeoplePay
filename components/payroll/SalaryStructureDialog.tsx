"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { AlertCircle, Loader2 } from "lucide-react";
import { SalaryStructure } from "./SalaryStructureTable";

interface SalaryStructureDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newStructure: SalaryStructure) => void;
}

export function SalaryStructureDialog({ isOpen, onClose, onSuccess }: SalaryStructureDialogProps) {
  const [name, setName] = useState("");
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        setName("");
        setActive(true);
        setError(null);
        setSubmitting(false);
      }, 0);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Name is required");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("peoplepay_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch("/api/salary-structures", {
        method: "POST",
        headers,
        body: JSON.stringify({ name: trimmedName, active }),
      });

      if (!res.ok) {
        let errorMsg = "Failed to create salary structure";
        try {
          const data = await res.json();
          if (data.error) errorMsg = data.error;
        } catch {}
        throw new Error(errorMsg);
      }

      const created = await res.json();
      onSuccess(created);
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
      title="New Salary Structure"
      description="Create a new salary structure to assign salary rules."
      maxWidth="sm"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-start">
            <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        
        <div>
          <label className="block text-sm font-medium text-[#26232A] mb-1">
            Structure Name <span className="text-red-500">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Executive Package 2026"
            disabled={submitting}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="active-checkbox"
            checked={active}
            onChange={(e) => setActive(e.target.checked)}
            disabled={submitting}
            className="w-4 h-4 rounded border-[#E8E3EA] text-[#9B7FA6] focus:ring-[#9B7FA6]"
          />
          <label htmlFor="active-checkbox" className="text-sm font-medium text-[#26232A]">
            Active
          </label>
        </div>

        <div className="flex justify-end pt-4 gap-2 border-t border-[#E8E3EA] mt-6">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || !name.trim()}>
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Structure"
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
