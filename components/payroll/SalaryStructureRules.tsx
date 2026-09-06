"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { AssignSalaryRuleDialog, SalaryRule } from "./AssignSalaryRuleDialog";
import { SalaryRuleDialog } from "./SalaryRuleDialog";

export interface StructureRule {
  id: string;
  structureId: string;
  ruleId: string;
  sequence: number;
  rule: SalaryRule;
}

interface SalaryStructureRulesProps {
  structureId: string;
  structureName: string;
  isActive: boolean;
  canManage: boolean;
}

export function SalaryStructureRules({
  structureId,
  structureName,
  isActive,
  canManage,
}: SalaryStructureRulesProps) {
  const [rules, setRules] = useState<StructureRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isNewRuleOpen, setIsNewRuleOpen] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = typeof window !== "undefined" ? localStorage.getItem("peoplepay_token") : null;
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`/api/salary-structures/${structureId}/rules`, { headers });
      if (!res.ok) {
        throw new Error("Failed to fetch assigned rules");
      }
      
      const data = await res.json();
      setRules(data);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }, [structureId]);

  useEffect(() => {
    if (structureId) {
      const timer = setTimeout(() => {
        fetchRules();
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [structureId, fetchRules]);

  const getCategoryVariant = (category: string) => {
    switch (category) {
      case "BASIC": return "info";
      case "ALLOWANCE": return "success";
      case "DEDUCTION": return "warning";
      case "GROSS":
      case "NET": return "default";
      default: return "default";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div>
        <h2 className="text-xl font-bold text-[#26232A] flex items-center gap-3">
          {structureName}
          <Badge variant={isActive ? "success" : "default"} size="sm">
            {isActive ? "Active" : "Inactive"}
          </Badge>
        </h2>
        <p className="text-xs text-[#77717B] font-mono mt-1">ID: {structureId}</p>
      </div>

      <div className="bg-white rounded-lg border border-[#E8E3EA] shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-[#E8E3EA] flex items-center justify-between">
          <h3 className="font-semibold text-[#26232A]">Salary Rules</h3>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsNewRuleOpen(true)}
              disabled={!canManage}
              title={!canManage ? "You do not have permission to create rules" : ""}
            >
              <Plus className="w-4 h-4 mr-1" />
              New Salary Rule
            </Button>
            <Button
              size="sm"
              onClick={() => setIsAssignOpen(true)}
              disabled={!canManage}
              title={!canManage ? "You do not have permission to assign rules" : ""}
            >
              <Plus className="w-4 h-4 mr-1" />
              Assign Rule
            </Button>
          </div>
        </div>

        {error ? (
          <div className="p-6">
            <div className="p-4 bg-red-50 text-red-600 text-sm rounded-md flex items-start">
              <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        ) : loading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="w-6 h-6 animate-spin text-[#9B7FA6]" />
          </div>
        ) : rules.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-[#26232A]">
              No salary rules assigned
            </p>
            <p className="mt-1 text-xs text-[#77717B]">
              Assign an existing rule to this structure to calculate payslips.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F9F8FA]">
                <tr className="border-b border-[#E8E3EA]">
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#77717B]">
                    Seq
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#77717B]">
                    Rule
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#77717B]">
                    Code
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#77717B]">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#77717B]">
                    Method
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[#77717B]">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {rules.map((sr) => (
                  <tr key={sr.id} className="border-b border-[#E8E3EA] last:border-b-0">
                    <td className="px-4 py-4 text-sm font-medium text-[#77717B]">
                      {sr.sequence}
                    </td>
                    <td className="px-4 py-4 text-sm font-medium text-[#26232A]">
                      {sr.rule.name}
                    </td>
                    <td className="px-4 py-4">
                      <code className="text-xs font-mono bg-[#F9F8FA] px-1.5 py-0.5 rounded text-[#524E57]">
                        {sr.rule.code}
                      </code>
                    </td>
                    <td className="px-4 py-4">
                      <Badge variant={getCategoryVariant(sr.rule.category)} size="sm">
                        {sr.rule.category}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-xs font-medium text-[#524E57]">
                      {sr.rule.computationMethod}
                    </td>
                    <td className="px-4 py-4 text-right text-sm font-semibold text-[#26232A]">
                      {sr.rule.computationMethod === "FIXED" && (
                        <span>₹{sr.rule.fixedAmount?.toFixed(2) || "0.00"}</span>
                      )}
                      {sr.rule.computationMethod === "PERCENTAGE" && (
                        <div>
                          <span>{sr.rule.percentage}%</span>
                          {sr.rule.formula && (
                            <div className="text-[10px] text-[#77717B] font-normal mt-0.5">
                              of {sr.rule.formula}
                            </div>
                          )}
                        </div>
                      )}
                      {sr.rule.computationMethod === "FORMULA" && (
                        <span className="font-mono text-xs text-[#71547D]">
                          {sr.rule.formula}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AssignSalaryRuleDialog
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onSuccess={fetchRules}
        structureId={structureId}
        assignedRuleIds={rules.map(r => r.ruleId)}
      />
      
      <SalaryRuleDialog
        isOpen={isNewRuleOpen}
        onClose={() => setIsNewRuleOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
}
