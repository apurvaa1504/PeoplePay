"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { api, ApiError } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

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

interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

const PAGE_SIZE = 10;
const SEARCH_DEBOUNCE_MS = 350;

function getStoredUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function RequestsContent() {
  const searchParams = useSearchParams();
  const employeeFilter = searchParams.get("employeeId") || "";

  const [currentUser] = useState<any>(() => getStoredUser());
  const currentUserRole: string = currentUser?.role || "EMPLOYEE";
  const isEmployee = currentUserRole === "EMPLOYEE";

  const [requests, setRequests] = useState<TimeOffRequest[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    pageSize: PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [types, setTypes] = useState<TimeOffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    employeeId: employeeFilter || (isEmployee ? currentUser?.employeeId || "" : ""),
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
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
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

  async function loadRequests(targetPage: number) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(targetPage),
        pageSize: String(PAGE_SIZE),
      });
      if (employeeFilter) params.set("employeeId", employeeFilter);
      if (debouncedSearch) params.set("search", debouncedSearch);

      const reqData = await api.get(`/api/time-off-requests?${params.toString()}`);
      setRequests(reqData.requests || []);
      if (reqData.pagination) setPagination(reqData.pagination);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load requests");
    } finally {
      setLoading(false);
    }
  }

  async function loadLookups() {
    try {
      const [empData, typeData] = await Promise.all([
        api.get("/api/employees"),
        api.get("/api/time-off-types"),
      ]);
      setEmployees(Array.isArray(empData) ? empData : empData.employees ?? []);
      setTypes(typeData.timeOffTypes || []);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load data");
    }
  }

  useEffect(() => {
    loadLookups();
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(handle);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [employeeFilter, debouncedSearch]);

  useEffect(() => {
    loadRequests(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, employeeFilter, debouncedSearch]);

  function employeeName(id: string) {
    const emp = employees.find((e) => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : id;
  }

  function typeName(id: string) {
    const type = types.find((t) => t.id === id);
    return type ? type.name : id;
  }

  const visibleRequests = requests;

  async function handleDecision(id: string, decision: "APPROVED" | "REFUSED") {
    setActioningId(id);
    setError("");
    try {
      await api.patch(`/api/time-off-requests/${id}/decision`, { decision });
      await loadRequests(page);
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
      if (page === 1) {
        await loadRequests(1);
      } else {
        setPage(1);
      }
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

  const canApprove =
    currentUserRole === "ADMIN" ||
    currentUserRole === "HR_MANAGER" ||
    currentUserRole === "HR_PAYROLL_USER" ||
    currentUserRole === "HR_PAYROLL_MANAGER";

  const rangeStart = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const rangeEnd = Math.min(pagination.page * pagination.pageSize, pagination.total);

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
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] rounded-md bg-[#FAECEC] border border-[#E9C3C3] px-4 py-2.5 text-xs text-[#9A4E4E] font-medium shadow-lg max-w-lg">
          {error}
        </div>
      )}

      <div className="mb-4">
        <Input
          placeholder="Search by employee name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-lg border border-[#E8E3EA] overflow-hidden shadow-2xs">
        <table className="w-full text-sm">
          <thead className="bg-[#F9F8FA] border-b border-[#E8E3EA]">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">Employee</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">Type</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">Dates</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">Duration (Days)</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">Status</th>
              <th className="px-4 py-2.5 text-right font-semibold text-[#524E57] text-xs uppercase tracking-wider">Action</th>
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
            {!loading && visibleRequests.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-[#77717B] text-sm">
                  No leave requests found.
                </td>
              </tr>
            )}
            {visibleRequests.map((r) => (
              <tr key={r.id} className="border-b border-[#F3F2F5] last:border-0 hover:bg-[#FCFBFD]">
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
                    canApprove ? (
                      <>
                        <Button variant="secondary" size="sm" isLoading={actioningId === r.id} onClick={() => handleDecision(r.id, "APPROVED")}>
                          Approve
                        </Button>
                        <Button variant="danger" size="sm" isLoading={actioningId === r.id} onClick={() => handleDecision(r.id, "REFUSED")}>
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

        {!loading && pagination.total > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 border-t border-[#E8E3EA] bg-[#F9F8FA]">
            <span className="text-xs text-[#77717B]">
              Showing {rangeStart}–{rangeEnd} of {pagination.total}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" disabled={pagination.page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="flex items-center gap-1">
                <ChevronLeft className="w-3.5 h-3.5" />
                Prev
              </Button>
              <span className="text-xs text-[#524E57] px-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={pagination.page >= pagination.totalPages} onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))} className="flex items-center gap-1">
                Next
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Request Time Off" maxWidth="sm">
        <form onSubmit={handleCreateRequest} className="space-y-4">
          {isEmployee ? (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#26232A]">Employee</label>
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
                ...employees.map((e) => ({ value: e.id, label: `${e.firstName} ${e.lastName}` })),
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
            <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => handleStartDateChange(e.target.value)} required />
            <Input label="End Date" type="date" min={form.startDate || undefined} value={form.endDate} onChange={(e) => handleEndDateChange(e.target.value)} required />
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
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" isLoading={submitting}>Submit Request</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default function TimeOffRequestsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#77717B]">Loading requests...</div>}>
      <RequestsContent />
    </Suspense>
  );
}