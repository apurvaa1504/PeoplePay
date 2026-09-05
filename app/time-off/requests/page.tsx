"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

interface TimeOffRequest {
  id: string;
  employeeId: string;
  timeOffTypeId: string;
  startDate: string;
  endDate: string;
  duration: number;
  status: "PENDING" | "APPROVED" | "REFUSED";
  decidedBy: string | null;
  decidedAt: string | null;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

interface TimeOffType {
  id: string;
  name: string;
}

export default function TimeOffRequestsPage() {
  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [types, setTypes] = useState<TimeOffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [reqData, empData, typeData] = await Promise.all([
        api.get("/api/time-off-requests"),
        api.get("/api/employees"),
        api.get("/api/time-off-types"),
      ]);
      setRequests(reqData.requests);
      setEmployees(Array.isArray(empData) ? empData : empData.employees ?? []);
      setTypes(typeData.timeOffTypes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  function employeeName(id: string) {
    const emp = employees.find((e) => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : id;
  }

  function typeName(id: string) {
    const type = types.find((t) => t.id === id);
    return type ? type.name : id;
  }

  async function handleDecision(id: string, decision: "APPROVED" | "REFUSED") {
    setActioningId(id);
    setError("");
    try {
      await api.patch(`/api/time-off-requests/${id}/decision`, { decision });
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update request");
    } finally {
      setActioningId(null);
    }
  }

  const statusVariant = {
    PENDING: "warning" as const,
    APPROVED: "success" as const,
    REFUSED: "danger" as const,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-[#26232A]">Time Off Requests</h1>
        <p className="text-sm text-[#77717B]">Review and decide on leave requests</p>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-[#FAECEC] border border-[#E9C3C3] px-3 py-2 text-xs text-[#9A4E4E] font-medium">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-[#E8E3EA] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F9F8FA] border-b border-[#E8E3EA]">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">Employee</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">Type</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">Dates</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">Duration</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">Status</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-[#77717B] text-sm">Loading...</td></tr>
            )}
            {!loading && requests.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-[#77717B] text-sm">No requests yet</td></tr>
            )}
            {requests.map((r) => (
              <tr key={r.id} className="border-b border-[#F3F2F5] last:border-0">
                <td className="px-4 py-3 font-medium text-[#26232A]">{employeeName(r.employeeId)}</td>
                <td className="px-4 py-3 text-[#524E57]">{typeName(r.timeOffTypeId)}</td>
                <td className="px-4 py-3 text-[#77717B] text-xs">
                  {new Date(r.startDate).toLocaleDateString()} – {new Date(r.endDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-[#524E57]">{r.duration}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[r.status]} size="sm">{r.status}</Badge>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {r.status === "PENDING" ? (
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        isLoading={actioningId === r.id}
                        onClick={() => handleDecision(r.id, "APPROVED")}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        isLoading={actioningId === r.id}
                        onClick={() => handleDecision(r.id, "REFUSED")}
                      >
                        Refuse
                      </Button>
                    </>
                  ) : (
                    <span className="text-xs text-[#A49FA8]">Decided</span>
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