"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ContractRecord } from "@/lib/types";
import { Building2, Briefcase, Calendar, CheckCircle2 } from "lucide-react";

interface ContractTableProps {
  contracts: ContractRecord[];
}

export function ContractTable({ contracts }: ContractTableProps) {
  return (
    <div className="w-full bg-white rounded-lg border border-[#E8E3EA] overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#26232A]">
          <thead className="bg-[#F9F8FA] border-b border-[#E8E3EA] text-[#77717B] font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th scope="col" className="px-4 py-3">Employee</th>
              <th scope="col" className="px-4 py-3">Start Date</th>
              <th scope="col" className="px-4 py-3">End Date</th>
              <th scope="col" className="px-4 py-3">Duration</th>
              <th scope="col" className="px-4 py-3">Department</th>
              <th scope="col" className="px-4 py-3">Job Position</th>
              <th scope="col" className="px-4 py-3">Wage</th>
              <th scope="col" className="px-4 py-3">Salary Structure</th>
              <th scope="col" className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E3EA]/70">
            {contracts.map((contract) => {
              const isActive = contract.status === "ACTIVE";

              // Duration calculation
              let duration = "Indefinite";
              if (contract.endDate) {
                const start = new Date(contract.startDate).getTime();
                const end = new Date(contract.endDate).getTime();
                const months = Math.round((end - start) / (1000 * 60 * 60 * 24 * 30.4375));
                duration = months > 0 ? `${months} months` : "< 1 month";
              }

              return (
                <tr
                  key={contract.id}
                  className={`transition-colors ${
                    isActive
                      ? "bg-[#FBF9FD]/90 hover:bg-[#F8F5FB]"
                      : "hover:bg-[#FCFBFD]"
                  }`}
                >
                  {/* Employee with Active Highlight indicator */}
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2.5">
                      {isActive && (
                        <CheckCircle2
                          className="w-4 h-4 text-[#5D8A6B] shrink-0"
                        />
                      )}
                      <div>
                        {contract.employee ? (
                          <Link
                            href={`/employees/${contract.employee.id}`}
                            className="font-semibold text-[#26232A] hover:text-[#71547D] transition-colors"
                          >
                            {contract.employee.firstName} {contract.employee.lastName}
                          </Link>
                        ) : (
                          <span className="font-mono text-[#77717B]">
                            {contract.employeeId.slice(0, 8)}
                          </span>
                        )}
                        <span className="block text-[10px] text-[#A49FA8]">
                          {contract.id.slice(0, 8)}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Start Date */}
                  <td className="px-4 py-3 text-[#524E57]">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#A49FA8]" />
                      {new Date(contract.startDate).toLocaleDateString()}
                    </span>
                  </td>

                  {/* End Date */}
                  <td className="px-4 py-3 text-[#524E57]">
                    {contract.endDate ? (
                      new Date(contract.endDate).toLocaleDateString()
                    ) : (
                      <span className="text-[#5D8A6B] font-medium text-[11px] bg-[#EDF4EE] px-1.5 py-0.5 rounded">
                        Open-ended
                      </span>
                    )}
                  </td>

                  {/* Duration */}
                  <td className="px-4 py-3 text-[#524E57]">{duration}</td>

                  {/* Department */}
                  <td className="px-4 py-3 text-[#524E57]">
                    {contract.department || contract.employee?.department || "—"}
                  </td>

                  {/* Job Position */}
                  <td className="px-4 py-3 text-[#524E57]">
                    {contract.jobPosition || contract.employee?.jobPosition || "—"}
                  </td>

                  {/* Wage */}
                  <td className="px-4 py-3 font-semibold text-[#26232A]">
                    ${contract.wage.toLocaleString()} <span className="text-[10px] font-normal text-[#77717B]">/yr</span>
                  </td>

                  {/* Salary Structure */}
                  <td className="px-4 py-3 text-[#524E57]">
                    <span className="font-mono text-[11px] bg-[#F9F8FA] px-1.5 py-0.5 rounded border border-[#E8E3EA]">
                      {contract.structureId || "Standard Base"}
                    </span>
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        contract.status === "ACTIVE"
                          ? "success"
                          : contract.status === "DRAFT"
                          ? "purple"
                          : "danger"
                      }
                      size="sm"
                    >
                      {contract.status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
