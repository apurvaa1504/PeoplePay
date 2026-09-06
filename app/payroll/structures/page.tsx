'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Layers,
  Plus,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Settings,
  AlertCircle,
  HelpCircle,
  FileCode,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
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

  const fetchStructures = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/salary-structures');
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
      const res = await fetch('/api/salary-rules');
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
      const res = await fetch(`/api/salary-structures/${structureId}/rules`);
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
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href="/payroll"
              className="text-xs font-medium text-slate-500 hover:text-emerald-600 transition flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Payroll
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Salary Structures</h1>
          <p className="text-sm text-slate-500">
            Define calculation templates and assign sequenced salary rules for automatic payroll computation
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/payroll/rules"
            className="inline-flex items-center px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition shadow-sm"
          >
            <FileCode className="w-4 h-4 mr-2 text-indigo-600" />
            Manage Rules
          </Link>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Structure
          </button>
        </div>
      </div>

      {/* Main Split Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Structure Selection List */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 h-fit">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Configured Structures
            </h3>
            <span className="text-xs text-slate-400 font-medium">{structures.length} Total</span>
          </div>

          <div className="space-y-2">
            {loading ? (
              <div className="p-4 text-center text-sm text-slate-400">Loading structures...</div>
            ) : structures.length === 0 ? (
              <div className="p-4 text-center text-sm text-slate-400">No salary structures found.</div>
            ) : (
              structures.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStructure(s)}
                  className={`w-full text-left p-3 rounded-lg border transition text-sm flex items-center justify-between ${
                    selectedStructure?.id === s.id
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 font-semibold'
                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/50 text-slate-700'
                  }`}
                >
                  <div className="truncate mr-2">{s.name}</div>
                  <div className="flex items-center gap-2">
                    {s.active ? (
                      <Badge variant="success">Active</Badge>
                    ) : (
                      <Badge variant="default">Inactive</Badge>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Structure Rule Composition */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">
                    {selectedStructure ? selectedStructure.name : 'Select a Structure'}
                  </h2>
                  {selectedStructure?.active && <Badge variant="success">Active</Badge>}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Rules attached to this structure are executed sequentially during payroll computation.
                </p>
              </div>

              {selectedStructure && (
                <button
                  onClick={() => {
                    setRuleSequence((structureRules.length + 1) * 10);
                    setShowAssignModal(true);
                  }}
                  className="inline-flex items-center px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Rule to Structure
                </button>
              )}
            </div>

            {/* Rules Breakdown Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4 w-16 text-center">Seq</th>
                    <th className="py-3 px-4">Rule Name</th>
                    <th className="py-3 px-4">Code</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-4 text-right">Value / Expression</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rulesLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                        Loading attached rules...
                      </td>
                    </tr>
                  ) : structureRules.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 text-sm">
                        No rules currently attached to this structure. Click "Add Rule to Structure" to configure.
                      </td>
                    </tr>
                  ) : (
                    structureRules.map((sr) => (
                      <tr key={sr.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-500">
                          {sr.sequence}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-900">
                          {sr.rule?.name || 'Unnamed'}
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-indigo-600 font-semibold">
                          {sr.rule?.code}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                              sr.rule?.category === 'BASIC'
                                ? 'bg-blue-50 text-blue-700'
                                : sr.rule?.category === 'ALLOWANCE'
                                ? 'bg-emerald-50 text-emerald-700'
                                : sr.rule?.category === 'DEDUCTION'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {sr.rule?.category}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 font-medium">
                          {sr.rule?.computationMethod}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-xs">
                          {sr.rule?.computationMethod === 'FIXED' && (
                            <span className="text-slate-800 font-medium">
                              ${sr.rule.fixedAmount?.toFixed(2)}
                            </span>
                          )}
                          {sr.rule?.computationMethod === 'PERCENTAGE' && (
                            <span className="text-slate-800 font-medium">
                              {sr.rule.percentage}% of Base
                            </span>
                          )}
                          {sr.rule?.computationMethod === 'FORMULA' && (
                            <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
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
      >
        <form onSubmit={handleCreateStructure} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Structure Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Standard Full-time Structure"
              value={newStructureName}
              onChange={(e) => setNewStructureName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
            >
              {createLoading ? 'Saving...' : 'Create Structure'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Assign Rule Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={`Assign Rule to ${selectedStructure?.name}`}
      >
        <form onSubmit={handleAssignRule} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Select Salary Rule *
            </label>
            <select
              required
              value={selectedRuleId}
              onChange={(e) => setSelectedRuleId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
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
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Execution Sequence Number *
            </label>
            <input
              type="number"
              required
              min="1"
              value={ruleSequence}
              onChange={(e) => setRuleSequence(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              Rules with lower numbers run first (e.g. 10 for Basic, 20 for Gross, 30 for Tax).
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
            >
              {assignLoading ? 'Assigning...' : 'Attach Rule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
