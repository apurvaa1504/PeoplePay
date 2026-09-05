import React from "react";
import { Users, AlertCircle, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export interface EligibleEmployee {
  id: string;
  firstName: string;
  lastName: string;
  department: string | null;
  jobPosition: string | null;
  contractId: string;
}

interface EmployeeSelectionStepProps {
  employees: EligibleEmployee[];
  selectedEmployeeIds: string[];
  onChange: (ids: string[]) => void;
  loading: boolean;
  error: string | null;
}

export function EmployeeSelectionStep({
  employees,
  selectedEmployeeIds,
  onChange,
  loading,
  error,
}: EmployeeSelectionStepProps) {
  const allSelected = employees.length > 0 && selectedEmployeeIds.length === employees.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(employees.map((e) => e.id));
    }
  };

  const handleToggle = (id: string) => {
    if (selectedEmployeeIds.includes(id)) {
      onChange(selectedEmployeeIds.filter((empId) => empId !== id));
    } else {
      onChange([...selectedEmployeeIds, id]);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-[#9B7FA6] animate-spin mb-4" />
        <p className="text-[#77717B] text-sm">Fetching eligible employees...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-red-500">
        <AlertCircle className="w-8 h-8 mb-4" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="py-6">
        <EmptyState
          icon={<Users className="w-5 h-5" />}
          title="No Eligible Employees"
          description="There are no active contracts for the selected structure in this period."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="text-sm text-[#77717B]">
          <span className="font-semibold text-[#26232A]">{selectedEmployeeIds.length}</span> of {employees.length} employees selected
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleSelectAll}
          type="button"
        >
          {allSelected ? "Deselect All" : "Select All"}
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto rounded-md border border-[#E8E3EA] bg-white">
        <div className="divide-y divide-[#E8E3EA]">
          {employees.map((emp) => {
            const isSelected = selectedEmployeeIds.includes(emp.id);
            return (
              <label
                key={emp.id}
                className={`flex items-center p-3 hover:bg-[#F9F8FA] cursor-pointer transition-colors ${
                  isSelected ? "bg-[#F1EBF3]/30" : ""
                }`}
              >
                <div className="flex-shrink-0 mr-4">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-[#9B7FA6] border-[#E8E3EA] rounded focus:ring-[#9B7FA6]"
                    checked={isSelected}
                    onChange={() => handleToggle(emp.id)}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#26232A] truncate">
                    {emp.firstName} {emp.lastName}
                  </div>
                  <div className="text-xs text-[#77717B] truncate">
                    {emp.jobPosition || "No Position"} • {emp.department || "No Department"}
                  </div>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
