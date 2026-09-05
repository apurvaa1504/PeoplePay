"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { EmployeeRecord } from "@/lib/types";
import { Briefcase, Building2, UserCheck, Calendar, ArrowRight } from "lucide-react";

interface EmployeeCardProps {
  employee: EmployeeRecord;
}

export function EmployeeCard({ employee }: EmployeeCardProps) {
  const initials = `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div className="bg-white rounded-lg border border-[#E8E3EA] p-4 shadow-2xs hover:shadow-xs hover:border-[#DCD4DF] transition-all flex flex-col justify-between group">
      <div>
        {/* Header: Avatar, Name, Status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#F1EBF3] border border-[#E0D3E3] text-[#71547D] font-bold text-sm flex items-center justify-center shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <Link
                href={`/employees/${employee.id}`}
                className="font-semibold text-sm text-[#26232A] hover:text-[#71547D] transition-colors truncate block"
              >
                {employee.firstName} {employee.lastName}
              </Link>
              <div className="flex items-center gap-1 text-[11px] text-[#77717B]">
                <Briefcase className="w-3 h-3 text-[#A49FA8]" />
                <span className="truncate">{employee.jobPosition || "No title assigned"}</span>
              </div>
            </div>
          </div>
          <Badge
            variant={employee.status === "ACTIVE" ? "success" : "danger"}
            size="sm"
          >
            {employee.status}
          </Badge>
        </div>

        {/* Details Grid */}
        <div className="space-y-1.5 pt-2 border-t border-[#F1EBF3] text-xs text-[#524E57]">
          <div className="flex items-center justify-between">
            <span className="text-[#A49FA8] text-[11px] flex items-center gap-1">
              <Building2 className="w-3 h-3" /> Dept:
            </span>
            <span className="font-medium text-[#26232A]">
              {employee.department || "—"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#A49FA8] text-[11px] flex items-center gap-1">
              <UserCheck className="w-3 h-3" /> Manager:
            </span>
            <span className="font-medium text-[#26232A] truncate max-w-[130px]">
              {employee.manager
                ? `${employee.manager.firstName} ${employee.manager.lastName}`
                : "None"}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#A49FA8] text-[11px] flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Schedule:
            </span>
            <span className="font-medium text-[#26232A] truncate max-w-[130px]">
              {employee.schedule ? `${employee.schedule.weeklyHours} hrs/wk` : "Standard"}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Link */}
      <div className="mt-4 pt-3 border-t border-[#F9F8FA] flex items-center justify-between text-xs">
        <span className="text-[11px] text-[#A49FA8]">
          ID: {employee.id.slice(0, 8)}
        </span>
        <Link
          href={`/employees/${employee.id}`}
          className="inline-flex items-center gap-1 text-[#71547D] font-medium text-xs hover:underline group-hover:translate-x-0.5 transition-transform"
        >
          View Profile <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
