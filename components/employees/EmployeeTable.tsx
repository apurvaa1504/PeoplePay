"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmployeeRecord } from "@/lib/types";
import { MoreHorizontal, ExternalLink, Calendar, Briefcase, UserCheck } from "lucide-react";

interface EmployeeTableProps {
  employees: EmployeeRecord[];
}

export function EmployeeTable({ employees }: EmployeeTableProps) {
  return (
    <div className="w-full bg-white rounded-lg border border-[#E8E3EA] overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#26232A]">
          <thead className="bg-[#F9F8FA] border-b border-[#E8E3EA] text-[#77717B] font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th scope="col" className="px-4 py-3">Employee</th>
              <th scope="col" className="px-4 py-3">Department</th>
              <th scope="col" className="px-4 py-3">Job Position</th>
              <th scope="col" className="px-4 py-3">Manager</th>
              <th scope="col" className="px-4 py-3">Schedule</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E3EA]/70">
            {employees.map((emp) => {
              const initials = `${emp.firstName?.[0] || ""}${emp.lastName?.[0] || ""}`.toUpperCase();

              return (
                <tr
                  key={emp.id}
                  className="hover:bg-[#FCFBFD] transition-colors group"
                >
                  {/* Employee Name & Avatar */}
                  <td className="px-4 py-3 font-medium">
                    <Link
                      href={`/employees/${emp.id}`}
                      className="flex items-center gap-3 hover:text-[#71547D] transition-colors"
                    >
                      <div className="w-8 h-8 rounded-full bg-[#F1EBF3] border border-[#E0D3E3] text-[#71547D] font-bold text-xs flex items-center justify-center shrink-0">
                        {initials}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-semibold text-[#26232A] group-hover:text-[#71547D] transition-colors">
                          {emp.firstName} {emp.lastName}
                        </span>
                        <span className="text-[11px] text-[#77717B]">
                          #{emp.id.replace(/-/g, '').slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </Link>
                  </td>

                  {/* Department */}
                  <td className="px-4 py-3 text-[#524E57]">
                    {emp.department ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#F9F8FA] border border-[#E8E3EA] text-xs">
                        {emp.department}
                      </span>
                    ) : (
                      <span className="text-[#A49FA8]">—</span>
                    )}
                  </td>

                  {/* Job Position */}
                  <td className="px-4 py-3 text-[#524E57]">
                    {emp.jobPosition ? (
                      <span className="flex items-center gap-1 text-xs">
                        <Briefcase className="w-3 h-3 text-[#A49FA8]" />
                        {emp.jobPosition}
                      </span>
                    ) : (
                      <span className="text-[#A49FA8]">—</span>
                    )}
                  </td>

                  {/* Manager */}
                  <td className="px-4 py-3 text-[#524E57]">
                    {emp.manager ? (
                      <span className="flex items-center gap-1.5 text-xs text-[#26232A]">
                        <UserCheck className="w-3.5 h-3.5 text-[#9B7FA6]" />
                        {emp.manager.firstName} {emp.manager.lastName}
                      </span>
                    ) : (
                      <span className="text-[#A49FA8]">No manager</span>
                    )}
                  </td>

                  {/* Schedule */}
                  <td className="px-4 py-3 text-[#524E57]">
                    {emp.schedule ? (
                      <span className="flex items-center gap-1 text-xs text-[#524E57]">
                        <Calendar className="w-3 h-3 text-[#A49FA8]" />
                        {emp.schedule.name} ({emp.schedule.weeklyHours}h)
                      </span>
                    ) : (
                      <span className="text-[#A49FA8]">—</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3">
                    <Badge
                      variant={emp.status === "ACTIVE" ? "success" : "danger"}
                      size="sm"
                    >
                      {emp.status}
                    </Badge>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/employees/${emp.id}`}
                        className="p-1 rounded text-[#77717B] hover:text-[#26232A] hover:bg-[#F1EBF3]/60 transition-colors"
                        title="View profile"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                      <Link
                        href={`/employees/${emp.id}/edit`}
                        className="p-1 rounded text-[#77717B] hover:text-[#26232A] hover:bg-[#F1EBF3]/60 transition-colors"
                        title="Edit employee"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </Link>
                    </div>
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
