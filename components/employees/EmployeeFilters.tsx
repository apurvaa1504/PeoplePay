"use client";

import React from "react";
import { Search, LayoutList, LayoutGrid } from "lucide-react";

interface EmployeeFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  department: string;
  onDepartmentChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  viewMode: "list" | "kanban";
  onViewModeChange: (mode: "list" | "kanban") => void;
  departments: string[];
}

export function EmployeeFilters({
  search,
  onSearchChange,
  department,
  onDepartmentChange,
  status,
  onStatusChange,
  viewMode,
  onViewModeChange,
  departments,
}: EmployeeFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-lg border border-[#E8E3EA] shadow-2xs mb-6">
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-3.5 h-3.5 text-[#A49FA8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by name, role, department..."
            className="w-full rounded-md border border-[#E8E3EA] bg-[#FCFBFD] pl-8 pr-3 py-1.5 text-xs text-[#26232A] placeholder:text-[#A49FA8] transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 focus:border-[#9B7FA6]"
          />
        </div>

        {/* Department Filter */}
        <select
          value={department}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className="rounded-md border border-[#E8E3EA] bg-[#FCFBFD] px-2.5 py-1.5 text-xs text-[#524E57] focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 cursor-pointer"
        >
          <option value="">All Departments</option>
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="rounded-md border border-[#E8E3EA] bg-[#FCFBFD] px-2.5 py-1.5 text-xs text-[#524E57] focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* View Switcher: List vs Kanban */}
      <div className="flex items-center gap-1 border border-[#E8E3EA] rounded-md p-0.5 bg-[#FCFBFD] self-end sm:self-auto">
        <button
          onClick={() => onViewModeChange("list")}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
            viewMode === "list"
              ? "bg-white text-[#26232A] shadow-2xs font-semibold"
              : "text-[#77717B] hover:text-[#26232A]"
          }`}
          title="List view"
        >
          <LayoutList className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">List</span>
        </button>
        <button
          onClick={() => onViewModeChange("kanban")}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-all cursor-pointer ${
            viewMode === "kanban"
              ? "bg-white text-[#26232A] shadow-2xs font-semibold"
              : "text-[#77717B] hover:text-[#26232A]"
          }`}
          title="Kanban view"
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Kanban</span>
        </button>
      </div>
    </div>
  );
}
