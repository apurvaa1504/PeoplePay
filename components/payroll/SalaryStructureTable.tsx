"use client";

import React from "react";
import { Badge } from "@/components/ui/Badge";
import { ChevronRight } from "lucide-react";

export interface SalaryStructure {
  id: string;
  name: string;
  active: boolean;
}

interface SalaryStructureTableProps {
  structures: SalaryStructure[];
  selectedId: string | null;
  onSelect: (structure: SalaryStructure) => void;
}

export function SalaryStructureTable({ structures, selectedId, onSelect }: SalaryStructureTableProps) {
  if (structures.length === 0) {
    return (
      <div className="px-6 py-12 text-center border border-[#E8E3EA] rounded-lg bg-white shadow-2xs">
        <p className="text-sm font-medium text-[#26232A]">
          No salary structures found
        </p>
        <p className="mt-1 text-xs text-[#77717B]">
          Create a new structure to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-[#E8E3EA] shadow-2xs">
      <table className="w-full">
        <thead className="bg-[#F9F8FA]">
          <tr className="border-b border-[#E8E3EA]">
            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#77717B]">
              Structure Name
            </th>
            <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#77717B]">
              Status
            </th>
            <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[#77717B]">
              Action
            </th>
          </tr>
        </thead>
        <tbody>
          {structures.map((structure) => {
            const isSelected = structure.id === selectedId;
            return (
              <tr
                key={structure.id}
                className={`border-b border-[#E8E3EA] last:border-b-0 cursor-pointer transition-colors ${
                  isSelected ? "bg-[#F1EBF3]" : "hover:bg-[#F9F8FA]"
                }`}
                onClick={() => onSelect(structure)}
              >
                <td className="px-4 py-4">
                  <div className="text-sm font-medium text-[#26232A]">
                    {structure.name}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <Badge variant={structure.active ? "success" : "default"} size="sm">
                    {structure.active ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-4 text-right">
                  <ChevronRight className="h-4 w-4 inline-block text-[#9B7FA6]" />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
