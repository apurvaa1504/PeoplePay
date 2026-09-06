'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  ArrowLeft,
  FileCode,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface Rule {
  id: string;
  name: string;
  code: string;
  category: string;
  computationMethod: string;
  fixedAmount?: number | null;
  percentage?: number | null;
  formula?: string | null;
}

interface StructureRule {
  id: string;
  structureId: string;
  ruleId: string;
  sequence: number;
  rule: Rule;
}

interface Structure {
  id: string;
  name: string;
  active: boolean;
}

function authHeaders(extra?: Record<string, string>) {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('peoplepay_token') || localStorage.getItem('token')
      : null;
  return {
    ...(extra ?? {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function SalaryStructuresPage() {
  const [structures, setStructures] = useState<Structure[]>([]);
  const [selectedStructure, setSelectedStructure] = useState<Structure | null>(null);
  const [structureRules, setStructureRules] = useState<StructureRule[]>([]);
  const [availableRules, setAvailableRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [rulesLoading, setRulesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Structure Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStructureName, setNewStructureName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);

  // Assign Rule Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState('');
  const [ruleSequence, setRuleSequence] = useState(1);
  const [assignLoading, setAssignLoading] = useState(false);

  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setCanManage(user.role === 'ADMIN' || user.role === 'HR_PAYROLL_MANAGER');
      }
    } catch {}
  }, []);

  const fetchStructures = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/salary-structures', { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch salary structures');
      const data = await res.json();
      setStructures(data);
      if (data.length > 0 && !selectedStructure) {
        setSelectedStructure(data[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRules = async () => {
    try {
      const res = await fetch('/api/salary-rules', { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setAvailableRules(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStructureRules = async (structureId: string) => {
    try {
      setRulesLoading(true);
      const res = await fetch(`/api/salary-structures/${structureId}/rules`, { headers: authHeaders() });
      if (!res.ok) throw new Error('Failed to fetch rules for structure');
      const data = await res.json();
      setStructureRules(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setRulesLoading(false);
    }
  };

  useEffect(() => {
    fetchStructures();
    fetchAllRules();
  }, []);

  useEffect(() => {
    if (selectedStructure) {
      fetchStructureRules(selectedStructure.id);
    }
  }, [selectedStructure]);

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStructureName.trim()) return;

    try {
      setCreateLoading(true);
      const res = await fetch('/api/salary-structures', {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ name: newStructureName.trim(), active: true }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create structure');
      }
      const created = await res.json();
      setShowCreateModal(false);
      setNewStructureName('');
      await fetchStructures();
      setSelectedStructure(created);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAssignRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStructure || !selectedRuleId) return;

    try {
      setAssignLoading(true);
      const res = await fetch(`/api/salary-structures/${selectedStructure.id}/rules`, {
        method: 'POST',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          ruleId: selectedRuleId,
          sequence: Number(ruleSequence),
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to assign rule');
      }
      setShowAssignModal(false);
      setSelectedRuleId('');
      fetchStructureRules(selectedStructure.id);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAssignLoading(false);
    }
  };

  const getCategoryBadgeVariant = (category: string): BadgeVariant => {
    switch (category) {
      case 'BASIC':
        return 'purple';
      case 'ALLOWANCE':
        return 'success';
      case 'DEDUCTION':
        return 'danger';
      case 'GROSS':
      case 'NET':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Operations' },
        { label: 'Payroll', href: '/payroll' },
        { label: 'Salary Structures' },
      ]}
      title="Salary Structures"
      actions={
        <div className="flex items-center gap-2">
          <Link href="/payroll/rules">
            <Button variant="outline" size="sm">
              <FileCode className="w-3.5 h-3.5 text-[#71547D]" />
              <span>Manage Rules</span>
            </Button>
          </Link>
          {canManage && (
            <Button size="sm" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4" />
              <span>New Structure</span>
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Main Split Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Structure Selection List */}
          <div className="bg-white rounded-xl border border-[#E8E3EA] shadow-2xs p-4 h-fit">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E3EA] mb-3">
              <h3 className="font-semibold text-[#26232A] text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#71547D]" />
                Configured Structures
              </h3>
              <span className="text-xs text-[#77717B] font-medium">{structures.length} Total</span>
            </div>

            <div className="space-y-2">
              {loading ? (
                <div className="p-4 text-center text-xs text-[#77717B]">Loading structures...</div>
              ) : structures.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#77717B]">No salary structures found.</div>
              ) : (
                structures.map((s) => {
                  const isSelected = selectedStructure?.id === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStructure(s)}
                      className={`w-full text-left p-3 rounded-lg border transition-all text-sm flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'border-[#9B7FA6] bg-[#F1EBF3]/70 text-[#26232A] font-semibold shadow-2xs'
                          : 'border-[#E8E3EA] hover:border-[#DCD4DF] hover:bg-[#FAF9FB] text-[#555259]'
                      }`}
                    >
                      <div className="truncate mr-2 font-medium">{s.name}</div>
                      <div className="flex items-center gap-2 shrink-0">
                        {s.active ? (
                          <Badge variant="success" size="sm">Active</Badge>
                        ) : (
                          <Badge variant="default" size="sm">Inactive</Badge>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Structure Rule Composition */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-[#E8E3EA] shadow-2xs overflow-hidden">
              <div className="p-5 border-b border-[#E8E3EA] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-base font-bold text-[#26232A]">
                      {selectedStructure ? selectedStructure.name : 'Select a Structure'}
                    </h2>
                    {selectedStructure?.active && <Badge variant="success" size="sm">Active</Badge>}
                  </div>
                  <p className="text-xs text-[#77717B] mt-1">
                    Rules attached to this structure are executed sequentially during payroll computation.
                  </p>
                </div>

                {selectedStructure && canManage && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setRuleSequence((structureRules.length + 1) * 10);
                      setShowAssignModal(true);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Rule to Structure</span>
                  </Button>
                )}
              </div>

              {/* Rules Breakdown Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-[#FAF9FB] border-b border-[#E8E3EA] text-xs font-semibold text-[#77717B]">
                      <th className="py-3 px-4 w-16 text-center">Seq</th>
                      <th className="py-3 px-4">Rule Name</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4 text-right">Value / Expression</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E3EA]">
                    {rulesLoading ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#77717B] text-xs">
                          Loading attached rules...
                        </td>
                      </tr>
                    ) : structureRules.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-[#77717B] text-xs">
                          No rules currently attached to this structure. Click "Add Rule to Structure" to configure.
                        </td>
                      </tr>
                    ) : (
                      structureRules.map((sr) => (
                        <tr key={sr.id} className="hover:bg-[#FAF9FB]/80 transition-colors">
                          <td className="py-3 px-4 text-center font-mono font-semibold text-[#77717B] text-xs">
                            {sr.sequence}
                          </td>
                          <td className="py-3 px-4 font-semibold text-[#26232A]">
                            {sr.rule?.name || 'Unnamed'}
                          </td>
                          <td className="py-3 px-4 font-mono text-xs text-[#71547D] font-semibold">
                            {sr.rule?.code}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={getCategoryBadgeVariant(sr.rule?.category || '')} size="sm">
                              {sr.rule?.category}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-xs text-[#555259] font-medium">
                            {sr.rule?.computationMethod}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-xs">
                            {sr.rule?.computationMethod === 'FIXED' && (
                              <span className="text-[#26232A] font-semibold">
                                ${sr.rule.fixedAmount?.toFixed(2)}
                              </span>
                            )}
                            {sr.rule?.computationMethod === 'PERCENTAGE' && (
                              <span className="text-[#26232A] font-semibold">
                                {sr.rule.percentage}% of Base
                              </span>
                            )}
                            {sr.rule?.computationMethod === 'FORMULA' && (
                              <span className="text-[#71547D] bg-[#F1EBF3] px-2 py-0.5 rounded border border-[#E0D3E3] font-mono">
                                {sr.rule.formula}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Create Structure Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Create New Salary Structure"
          description="Define a template name for grouping sequenced payroll rules"
        >
          <form onSubmit={handleCreateStructure} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#26232A] mb-1.5">
                Structure Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Standard Full-time Structure"
                value={newStructureName}
                onChange={(e) => setNewStructureName(e.target.value)}
                className="w-full px-3 py-2 border border-[#E8E3EA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 focus:border-[#9B7FA6] transition-colors"
              />
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E3EA]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={createLoading}
              >
                Create Structure
              </Button>
            </div>
          </form>
        </Modal>

        {/* Assign Rule Modal */}
        <Modal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          title={`Assign Rule to ${selectedStructure?.name}`}
          description="Select a rule and define its execution priority sequence"
        >
          <form onSubmit={handleAssignRule} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#26232A] mb-1.5">
                Select Salary Rule *
              </label>
              <select
                required
                value={selectedRuleId}
                onChange={(e) => setSelectedRuleId(e.target.value)}
                className="w-full px-3 py-2 border border-[#E8E3EA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 focus:border-[#9B7FA6] bg-white text-[#26232A] transition-colors"
              >
                <option value="">-- Choose a Rule --</option>
                {availableRules.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.code}) — {r.category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#26232A] mb-1.5">
                Execution Sequence Number *
              </label>
              <input
                type="number"
                required
                min="1"
                value={ruleSequence}
                onChange={(e) => setRuleSequence(Number(e.target.value))}
                className="w-full px-3 py-2 border border-[#E8E3EA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 focus:border-[#9B7FA6] transition-colors"
              />
              <p className="text-[11px] text-[#77717B] mt-1">
                Rules with lower numbers run first (e.g. 10 for Basic, 20 for Gross, 30 for Tax).
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E3EA]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={assignLoading}
              >
                Attach Rule
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}