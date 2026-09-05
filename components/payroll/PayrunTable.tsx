"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Calendar, CreditCard, ChevronRight } from "lucide-react";

export type PayrunStatus = "DRAFT" | "COMPUTED" | "VALIDATED" | "PAID";

export interface PayrunItem {
  id: string;
  name: string;
  structureId: string;
  structureName?: string;
  periodStart: string;
  periodEnd: string;
  status: PayrunStatus;
  createdAt: string;
}

interface PayrunTableProps {
  payruns: PayrunItem[];
  onSelect?: (payrun: PayrunItem) => void;
}

export function PayrunTable({ payruns, onSelect }: PayrunTableProps) {
  const getStatusVariant = (status: PayrunStatus) => {
    switch (status) {
      case "DRAFT":
        return "default";
      case "COMPUTED":
        return "info";
      case "VALIDATED":
        return "warning";
      case "PAID":
        return "success";
      default:
        return "default";
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-[#E8E3EA] overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#26232A]">
          <thead className="bg-[#F9F8FA] border-b border-[#E8E3EA] text-[#77717B] font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th scope="col" className="px-4 py-3">Payrun</th>
              <th scope="col" className="px-4 py-3">Period</th>
              <th scope="col" className="px-4 py-3">Salary Structure</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Created</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E3EA]/70">
            {payruns.map((payrun) => (
              <tr
                key={payrun.id}
                className="hover:bg-[#FCFBFD] transition-colors"
              >
                <td className="px-4 py-3 font-medium">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-[#F1EBF3] flex items-center justify-center text-[#9B7FA6] shrink-0">
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#26232A]">
                        {payrun.name}
                      </div>
                      <div className="text-[11px] text-[#77717B] font-mono">
                        ID: {payrun.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#524E57]">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#A49FA8] shrink-0" />
                    <span>
                      {formatDate(payrun.periodStart)} – {formatDate(payrun.periodEnd)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 text-[#524E57]">
                  <span className="font-medium text-[#26232A]">
                    {payrun.structureName || "Default Structure"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={getStatusVariant(payrun.status)} size="sm">
                    {payrun.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-[#77717B]">
                  {formatDate(payrun.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  {onSelect ? (
                    <button
                      onClick={() => onSelect(payrun)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#71547D] bg-[#F1EBF3] hover:bg-[#E8DFEC] rounded-md transition-colors"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <Link
                      href={`/payroll/payruns/${payrun.id}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#71547D] bg-[#F1EBF3] hover:bg-[#E8DFEC] rounded-md transition-colors"
                    >
                      <span>View</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PayrunTable;
