"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";

interface TimeOffType {
  id: string;
  name: string;
  unit: "DAYS" | "HOURS";
  requiresAllocation: boolean;
  requiresApproval: boolean;
  payrollIntegration: boolean;
}

const emptyForm = {
  name: "",
  unit: "DAYS" as "DAYS" | "HOURS",
  requiresAllocation: true,
  requiresApproval: true,
  payrollIntegration: false,
};

export default function TimeOffTypesPage() {
  const [types, setTypes] = useState<TimeOffType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  async function loadTypes() {
    setLoading(true);
    setError("");
    try {
      const data = await api.get("/api/time-off-types");
      setTypes(data.timeOffTypes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load time off types");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTypes();
  }, []);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(type: TimeOffType) {
    setEditingId(type.id);
    setForm({
      name: type.name,
      unit: type.unit,
      requiresAllocation: type.requiresAllocation,
      requiresApproval: type.requiresApproval,
      payrollIntegration: type.payrollIntegration,
    });
    setModalOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      if (editingId) {
        await api.patch(`/api/time-off-types/${editingId}`, form);
      } else {
        await api.post("/api/time-off-types", form);
      }
      setModalOpen(false);
      await loadTypes();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this time off type?")) return;
    try {
      await api.delete(`/api/time-off-types/${id}`);
      await loadTypes();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#26232A]">Time Off Types</h2>
          <p className="text-xs text-[#77717B]">Configure leave policies and rules</p>
        </div>
        <Button onClick={openCreate}>+ New Type</Button>
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
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">Name</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">Unit</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">Allocation</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">Approval</th>
              <th className="text-left px-4 py-2.5 font-semibold text-[#524E57] text-xs uppercase tracking-wider">Payroll</th>
              <th className="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-[#77717B] text-sm">Loading...</td></tr>
            )}
            {!loading && types.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-center text-[#77717B] text-sm">No time off types yet</td></tr>
            )}
            {types.map((type) => (
              <tr key={type.id} className="border-b border-[#F3F2F5] last:border-0">
                <td className="px-4 py-3 font-medium text-[#26232A]">{type.name}</td>
                <td className="px-4 py-3">
                  <Badge variant="purple" size="sm">{type.unit}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={type.requiresAllocation ? "success" : "default"} size="sm">
                    {type.requiresAllocation ? "Required" : "Not required"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={type.requiresApproval ? "warning" : "default"} size="sm">
                    {type.requiresApproval ? "Required" : "Auto"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={type.payrollIntegration ? "info" : "default"} size="sm">
                    {type.payrollIntegration ? "Linked" : "Not linked"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(type)}>Edit</Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(type.id)}>Delete</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Time Off Type" : "New Time Off Type"}
        maxWidth="sm"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Select
            label="Unit"
            value={form.unit}
            onChange={(e) => setForm({ ...form, unit: e.target.value as "DAYS" | "HOURS" })}
            options={[
              { value: "DAYS", label: "Days" },
              { value: "HOURS", label: "Hours" },
            ]}
          />

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-[#26232A]">
              <input
                type="checkbox"
                checked={form.requiresAllocation}
                onChange={(e) => setForm({ ...form, requiresAllocation: e.target.checked })}
              />
              Requires allocation
            </label>
            <label className="flex items-center gap-2 text-sm text-[#26232A]">
              <input
                type="checkbox"
                checked={form.requiresApproval}
                onChange={(e) => setForm({ ...form, requiresApproval: e.target.checked })}
              />
              Requires approval
            </label>
            <label className="flex items-center gap-2 text-sm text-[#26232A]">
              <input
                type="checkbox"
                checked={form.payrollIntegration}
                onChange={(e) => setForm({ ...form, payrollIntegration: e.target.checked })}
              />
              Payroll integration
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving}>
              {editingId ? "Save changes" : "Create"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}