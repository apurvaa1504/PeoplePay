"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Plus } from "lucide-react";

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

function RequestsContent() {
  const searchParams = useSearchParams();
  const employeeFilter = searchParams.get("employeeId") || "";

  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [types, setTypes] = useState<TimeOffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Modal for new request
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    employeeId: employeeFilter || "",
    timeOffTypeId: "",
    startDate: "",
    endDate: "",
    duration: "1",
  });

  const calculateDuration = (start: string, end: string) => {
    if (!start) return "1";
    if (!end) return "1";
    const s = new Date(start);
    const e = new Date(end);
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return "1";
    const diffTime = e.getTime() - s.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // inclusive
    return diffDays > 0 ? diffDays.toString() : "1";
  };

  const handleStartDateChange = (startDate: string) => {
    const endDate = form.endDate && form.endDate >= startDate ? form.endDate : startDate;
    const duration = calculateDuration(startDate, endDate);
    setForm((prev) => ({ ...prev, startDate, endDate, duration }));
  };

  const handleEndDateChange = (endDate: string) => {
    const startDate = form.startDate || endDate;
    const duration = calculateDuration(startDate, endDate);
    setForm((prev) => ({ ...prev, endDate, duration }));
  };

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [currentUserRole, setCurrentUserRole] = useState<string>("EMPLOYEE");

  useEffect(() => {
    try {
      const user = localStorage.getItem("user");
      if (user) {
        const parsed = JSON.parse(user);
        setCurrentUser(parsed);
        setCurrentUserRole(parsed.role || "EMPLOYEE");
        if (parsed.role === "EMPLOYEE" && parsed.employeeId) {
          setForm((prev) => ({ ...prev, employeeId: parsed.employeeId }));
        }
      }
    } catch {}
  }, []);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [reqData, empData, typeData] = await Promise.all([
        api.get("/api/time-off-requests"),
        api.get("/api/employees"),
        api.get("/api/time-off-types"),
      ]);
      setRequests(reqData.requests || []);
      setEmployees(Array.isArray(empData) ? empData : empData.employees ?? []);
      setTypes(typeData.timeOffTypes || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (employeeFilter && !form.employeeId) {
      setForm((prev) => ({ ...prev, employeeId: employeeFilter }));
    } else if (currentUser?.role === "EMPLOYEE" && currentUser?.employeeId) {
      setForm((prev) => ({ ...prev, employeeId: currentUser.employeeId }));
    }
  }, [employeeFilter, currentUser]);

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

  async function handleCreateRequest(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const targetEmpId = currentUser?.role === "EMPLOYEE" && currentUser?.employeeId ? currentUser.employeeId : form.employeeId;
      await api.post("/api/time-off-requests", {
        employeeId: targetEmpId,
        timeOffTypeId: form.timeOffTypeId,
        startDate: form.startDate,
        endDate: form.endDate,
        duration: parseFloat(form.duration),
      });
      setModalOpen(false);
      setForm({
        employeeId: (currentUser?.role === "EMPLOYEE" ? currentUser?.employeeId : employeeFilter) || "",
        timeOffTypeId: "",
        startDate: "",
        endDate: "",
        duration: "1",
      });
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit request");
    } finally {
      setSubmitting(false);
    }
  }

  const statusVariant = {
    PENDING: "warning" as const,
    APPROVED: "success" as const,
    REFUSED: "danger" as const,
  };

  const isEmployee = currentUserRole === "EMPLOYEE";
  const filteredRequests = isEmployee
    ? requests.filter((r) => r.employeeId === currentUser?.employeeId)
    : employeeFilter
    ? requests.filter((r) => r.employeeId === employeeFilter)
    : requests;

  const canApprove =
    currentUserRole === "ADMIN" ||
    currentUserRole === "HR_MANAGER" ||
    currentUserRole === "HR_PAYROLL_USER" ||
    currentUserRole === "HR_PAYROLL_MANAGER";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#26232A]">Leave Requests</h2>
          <p className="text-xs text-[#77717B]">
            {canApprove
              ? "Review and decide on submitted employee leave requests"
              : "Submit and track your time off requests"}
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="flex items-center gap-1.5">
          <Plus className="w-4 h-4" />
          <span>Request Time Off</span>
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-[#FAECEC] border border-[#E9C3C3] px-3 py-2 text-xs text-[#9A4E4E] font-medium">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg border border-[#E8E3EA] overflow-hidden shadow-2xs">
        <table className="w-full text-sm">
          <thead className="bg-[#F9F8FA] border-b border-[#E8E3EA]">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">
                Employee
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">
                Type
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">
                Dates
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">
                Duration (Days)
              </th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-2.5 text-right font-semibold text-[#524E57] text-xs uppercase tracking-wider">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[#77717B] text-sm">
                  Loading requests...
                </td>
              </tr>
            )}
            {!loading && filteredRequests.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[#77717B] text-sm">
                  No leave requests found.
                </td>
              </tr>
            )}
            {filteredRequests.map((r) => (
              <tr key={r.id} className="border-b border-[#F3F2F5] last:border-0 hover:bg-[#FCFBFD]">
                <td className="px-4 py-3 font-medium text-[#26232A]">
                  {employeeName(r.employeeId)}
                </td>
                <td className="px-4 py-3 text-[#524E57]">{typeName(r.timeOffTypeId)}</td>
                <td className="px-4 py-3 text-[#77717B] text-xs">
                  {new Date(r.startDate).toLocaleDateString()} –{" "}
                  {new Date(r.endDate).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-[#524E57]">{r.duration}</td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariant[r.status]} size="sm">
                    {r.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  {r.status === "PENDING" ? (
                    canApprove ? (
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
                      <span className="text-xs text-[#E5A54B] font-medium">Pending Review</span>
                    )
                  ) : (
                    <span className="text-xs text-[#A49FA8]">Decided</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* New Request Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Request Time Off"
        maxWidth="sm"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          {isEmployee ? (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#26232A]">
                Employee
              </label>
              <div className="px-3 py-2 rounded-md bg-[#F9F8FA] border border-[#E8E3EA] flex items-center justify-between text-xs">
                <span className="font-semibold text-[#26232A]">
                  {employeeName(currentUser?.employeeId || form.employeeId) || "Your Employee Record"}
                </span>
                <span className="text-[11px] text-[#71547D] bg-[#F1EBF3] px-2 py-0.5 rounded font-medium">
                  Logged-in Employee
                </span>
              </div>
              <p className="text-[11px] text-[#77717B]">
                Time off requests can only be filed for your personal profile.
              </p>
            </div>
          ) : (
            <Select
              label="Employee"
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              options={[
                { value: "", label: "Select employee..." },
                ...employees.map((e) => ({
                  value: e.id,
                  label: `${e.firstName} ${e.lastName}`,
                })),
              ]}
              required
            />
          )}
          <Select
            label="Time Off Type"
            value={form.timeOffTypeId}
            onChange={(e) => setForm({ ...form, timeOffTypeId: e.target.value })}
            options={[
              { value: "", label: "Select leave type..." },
              ...types.map((t) => ({ value: t.id, label: t.name })),
            ]}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              required
            />
            <Input
              label="End Date"
              type="date"
              min={form.startDate || undefined}
              value={form.endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              required
            />
          </div>
          <Input
            label="Duration (Days)"
            type="number"
            min="0.5"
            step="0.5"
            value={form.duration}
            onChange={(e) => setForm({ ...form, duration: e.target.value })}
            helperText="Automatically computed from start and end dates (can be fine-tuned e.g. for half-days)"
            required
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={submitting}>
              Submit Request
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function TimeOffRequestsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-[#77717B]">Loading requests...</div>
      }
    >
      <RequestsContent />
    </Suspense>
  );
}