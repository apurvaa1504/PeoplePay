"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { AttendanceRecord } from "@/lib/types";
import { Edit2, ShieldAlert } from "lucide-react";

interface AttendanceTableProps {
  attendances: AttendanceRecord[];
  onRecordUpdated?: () => void;
}

export function AttendanceTable({
  attendances,
  onRecordUpdated,
}: AttendanceTableProps) {
  // Manual correction state
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        setCurrentUserRole(JSON.parse(stored).role);
      }
    } catch {}
  }, []);

  const isEmployee = currentUserRole === "EMPLOYEE";
  const [correctionForm, setCorrectionForm] = useState({
    checkIn: "",
    checkOut: "",
    status: "MANUAL_CORRECTION",
  });
  const [saving, setSaving] = useState(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  const openCorrectionModal = (record: AttendanceRecord) => {
    setSelectedRecord(record);
    setCorrectionForm({
      checkIn: record.checkIn ? record.checkIn.slice(0, 16) : "",
      checkOut: record.checkOut ? record.checkOut.slice(0, 16) : "",
      status: "MANUAL_CORRECTION",
    });
    setCorrectionError(null);
    setModalOpen(true);
  };

  const handleSaveCorrection = async () => {
    if (!selectedRecord) return;
    setSaving(true);
    setCorrectionError(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("peoplepay_token") : null;
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch("/api/attendance", {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          id: selectedRecord.id,
          checkIn: correctionForm.checkIn ? new Date(correctionForm.checkIn).toISOString() : null,
          checkOut: correctionForm.checkOut ? new Date(correctionForm.checkOut).toISOString() : null,
          status: correctionForm.status,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to submit manual correction");
      }

      setModalOpen(false);
      if (onRecordUpdated) onRecordUpdated();
    } catch (err: any) {
      setCorrectionError(err.message || "Failed to update attendance.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-lg border border-[#E8E3EA] overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-[#26232A]">
          <thead className="bg-[#F9F8FA] border-b border-[#E8E3EA] text-[#77717B] font-semibold uppercase tracking-wider text-[10px]">
            <tr>
              <th scope="col" className="px-4 py-3">Employee</th>
              <th scope="col" className="px-4 py-3">Check In</th>
              <th scope="col" className="px-4 py-3">Check Out</th>
              <th scope="col" className="px-4 py-3">Worked Hours</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Corrected By</th>
              <th scope="col" className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E8E3EA]/70">
            {attendances.map((rec) => {
              const formatTimestamp = (ts?: string | null) => {
                if (!ts) return "—";
                return new Date(ts).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });
              };

              return (
                <tr key={rec.id} className="hover:bg-[#FCFBFD] transition-colors">
                  {/* Employee */}
                  <td className="px-4 py-3 font-medium">
                    {rec.employee ? (
                      <Link
                        href={`/employees/${rec.employee.id}`}
                        className="font-semibold text-[#26232A] hover:text-[#71547D] transition-colors"
                      >
                        {rec.employee.firstName} {rec.employee.lastName}
                      </Link>
                    ) : (
                      <span className="font-mono text-[#77717B]">
                        {rec.employeeId.slice(0, 8)}
                      </span>
                    )}
                    <span className="block text-[10px] text-[#A49FA8]">
                      {rec.id.slice(0, 8)}
                    </span>
                  </td>

                  {/* Check In */}
                  <td className="px-4 py-3 text-[#524E57]">
                    {formatTimestamp(rec.checkIn)}
                  </td>

                  {/* Check Out */}
                  <td className="px-4 py-3 text-[#524E57]">
                    {formatTimestamp(rec.checkOut)}
                  </td>

                  {/* Worked Hours */}
                  <td className="px-4 py-3 font-semibold text-[#26232A]">
                    {rec.workedHours !== null && rec.workedHours !== undefined ? (
                      <span>{rec.workedHours.toFixed(2)} hrs</span>
                    ) : (
                      <span className="text-[#A49FA8]">In progress</span>
                    )}
                  </td>

                  {/* Status Badge */}
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        rec.status === "PRESENT"
                          ? "success"
                          : rec.status === "LATE"
                          ? "warning"
                          : rec.status === "MANUAL_CORRECTION"
                          ? "purple"
                          : "danger"
                      }
                      size="sm"
                    >
                      {rec.status.replace("_", " ")}
                    </Badge>
                  </td>

                  {/* Corrected By */}
                  <td className="px-4 py-3 text-[11px] text-[#77717B]">
                    {rec.correctedBy ? (
                      <span className="bg-[#F1EBF3] text-[#71547D] px-2 py-0.5 rounded font-medium">
                        {rec.correctedBy}
                      </span>
                    ) : (
                      <span className="text-[#A49FA8]">—</span>
                    )}
                  </td>

                  {/* Actions: Manual Correction UI for Authorized Users */}
                  <td className="px-4 py-3 text-right">
                    {!isEmployee ? (
                      <button
                        onClick={() => openCorrectionModal(rec)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#71547D] bg-[#F1EBF3] hover:bg-[#E8DFEC] rounded transition-colors cursor-pointer"
                        title="Manual Correction (Authorized HR/Admin)"
                      >
                        <Edit2 className="w-3 h-3" /> Correct
                      </button>
                    ) : (
                      <span className="text-[11px] text-[#A49FA8]">Logged</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Manual Correction Modal */}
      {selectedRecord && (
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Manual Attendance Correction"
          description="Authorized HR Managers can adjust check-in/out stamps and correct status."
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-2.5 bg-[#FBF4E8] border border-[#EBD6B8] rounded text-xs text-[#866332]">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>
                Manual correction will record your identity as the corrector for audit compliance.
              </span>
            </div>

            {correctionError && (
              <div className="p-2.5 bg-[#FAECEC] border border-[#E9C3C3] rounded text-xs text-[#9A4E4E]">
                {correctionError}
              </div>
            )}

            <Input
              label="Check In Timestamp"
              type="datetime-local"
              value={correctionForm.checkIn}
              onChange={(e) =>
                setCorrectionForm({ ...correctionForm, checkIn: e.target.value })
              }
            />

            <Input
              label="Check Out Timestamp"
              type="datetime-local"
              value={correctionForm.checkOut}
              onChange={(e) =>
                setCorrectionForm({ ...correctionForm, checkOut: e.target.value })
              }
            />

            <Select
              label="Attendance Status"
              value={correctionForm.status}
              options={[
                { value: "MANUAL_CORRECTION", label: "Manual Correction" },
                { value: "PRESENT", label: "Present" },
                { value: "LATE", label: "Late" },
                { value: "OVERTIME", label: "Overtime" },
                { value: "ABSENT", label: "Absent" },
              ]}
              onChange={(e) =>
                setCorrectionForm({ ...correctionForm, status: e.target.value })
              }
            />

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E8E3EA]">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setModalOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveCorrection}
                isLoading={saving}
              >
                Apply Correction
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
