"use client";

import React from "react";
import { WorkingScheduleRecord } from "@/lib/types";
import { Calendar, Users } from "lucide-react";

interface ScheduleTableProps {
  schedules: WorkingScheduleRecord[];
}

export function ScheduleTable({ schedules }: ScheduleTableProps) {
  return (
    <div className="w-full bg-white rounded-lg border border-[#E8E3EA] overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#26232A]">
          <thead className="bg-[#F9F8FA] border-b border-[#E8E3EA] text-[#77717B] font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th scope="col" className="px-4 py-3">Schedule Name</th>
              <th scope="col" className="px-4 py-3">Total Weekly Hours</th>
              <th scope="col" className="px-4 py-3">Assigned Employees</th>
              <th scope="col" className="px-4 py-3">Calculation Source</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E3EA]/70">
            {schedules.map((schedule) => (
              <tr key={schedule.id} className="hover:bg-[#FCFBFD] transition-colors">
                <td className="px-4 py-3 font-semibold text-[#26232A]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-md bg-[#F1EBF3] text-[#71547D] flex items-center justify-center">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span>{schedule.name}</span>
                      <span className="block text-[10px] text-[#A49FA8] font-mono">
                        {schedule.id}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3 font-semibold text-[#71547D]">
                  <span className="bg-[#F1EBF3] px-2.5 py-1 rounded-md text-xs">
                    {schedule.weeklyHours} hrs/week
                  </span>
                </td>

                <td className="px-4 py-3 text-[#524E57]">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#A49FA8]" />
                    {schedule.assignedEmployeesCount ?? 0} employees
                  </span>
                </td>

                <td className="px-4 py-3 text-[#77717B] text-[11px]">
                  Derived from schedule lines
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
