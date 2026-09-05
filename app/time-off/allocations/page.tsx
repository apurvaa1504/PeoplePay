"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

interface Allocation {
  id: string;
  employeeId: string;
  timeOffTypeId: string;
  allocated: number;
  taken: number;
  remaining: number;
  validFrom: string;
  validTo: string | null;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
}

interface TimeOffType {
  id: string;
  name: string;
  unit: string;
}

const emptyForm = {
  employeeId: "",
  timeOffTypeId: "",
  allocated: "",
  validFrom: "",
  validTo: "",
};

export default function AllocationsPage() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [types, setTypes] = useState<TimeOffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [allocData, empData, typeData] = await Promise.all([
        api.get("/api/allocations"),
        api.get("/api/employees"),
        api.get("/api/time-off-types"),
      ]);
      setAllocations(allocData.allocations);
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

  function openCreate() {
    setForm(emptyForm);
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post("/api/allocations", {
        employeeId: form.employeeId,
        timeOffTypeId: form.timeOffTypeId,
        allocated: Number(form.allocated),
        validFrom: form.validFrom,
        validTo: form.validTo || null,
      });
      setModalOpen(false);
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this allocation?")) return;
    try {
      await api.delete(`/api/allocations/${id}`);
      await loadAll();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#26232A]">Allocations</h2>
          <p className="text-xs text-[#77717B]">Employee leave balances and allowances</p>
        </div>
        <Button onClick={openCreate}>+ New Allocation</Button>
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
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">Allocated</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">Taken</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">Remaining</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">Valid Until</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-[#77717B] text-sm">Loading...</td></tr>
            )}
            {!loading && allocations.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-[#77717B] text-sm">No allocations yet</td></tr>
            )}
            {allocations.map((a) => (
              <tr key={a.id} className="border-b border-[#F3F2F5] last:border-0">
                <td className="px-4 py-3 font-medium text-[#26232A]">{employeeName(a.employeeId)}</td>
                <td className="px-4 py-3 text-[#524E57]">{typeName(a.timeOffTypeId)}</td>
                <td className="px-4 py-3 text-[#524E57]">{a.allocated}</td>
                <td className="px-4 py-3 text-[#524E57]">{a.taken}</td>
                <td className="px-4 py-3">
                  <Badge variant={a.remaining > 0 ? "success" : "danger"} size="sm">
                    {a.remaining}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-[#77717B] text-xs">
                  {a.validTo ? new Date(a.validTo).toLocaleDateString() : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(a.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="New Allocation"
        maxWidth="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
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
          <Select
            label="Time Off Type"
            value={form.timeOffTypeId}
            onChange={(e) => setForm({ ...form, timeOffTypeId: e.target.value })}
            options={[
              { value: "", label: "Select type..." },
              ...types.map((t) => ({ value: t.id, label: `${t.name} (${t.unit})` })),
            ]}
            required
          />
          <Input
            label="Allocated Amount"
            type="number"
            min="0.5"
            step="0.5"
            value={form.allocated}
            onChange={(e) => setForm({ ...form, allocated: e.target.value })}
            required
          />
          <Input
            label="Valid From"
            type="date"
            value={form.validFrom}
            onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
            required
          />
          <Input
            label="Valid To"
            type="date"
            value={form.validTo}
            onChange={(e) => setForm({ ...form, validTo: e.target.value })}
            helperText="Optional"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}