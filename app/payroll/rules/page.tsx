'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  FileCode,
  Plus,
  ArrowLeft,
  Layers,
  Percent,
  DollarSign,
  Code,
  Search,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

interface SalaryRule {
  id: string;
  name: string;
  code: string;
  category: 'BASIC' | 'ALLOWANCE' | 'GROSS' | 'DEDUCTION' | 'NET';
  computationMethod: 'FIXED' | 'PERCENTAGE' | 'FORMULA';
  fixedAmount?: number | null;
  percentage?: number | null;
  formula?: string | null;
}

export default function SalaryRulesPage() {
  const [rules, setRules] = useState<SalaryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<'BASIC' | 'ALLOWANCE' | 'GROSS' | 'DEDUCTION' | 'NET'>('ALLOWANCE');
  const [computationMethod, setComputationMethod] = useState<'FIXED' | 'PERCENTAGE' | 'FORMULA'>('FIXED');
  const [fixedAmount, setFixedAmount] = useState<string>('0');
  const [percentage, setPercentage] = useState<string>('10');
  const [formula, setFormula] = useState<string>('BASIC * 0.1');

  const fetchRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/salary-rules');
      if (!res.ok) throw new Error('Failed to fetch salary rules');
      const data = await res.json();
      setRules(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setError(null);

      const payload: any = {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        category,
        computationMethod,
      };

      if (computationMethod === 'FIXED') {
        payload.fixedAmount = parseFloat(fixedAmount) || 0;
      } else if (computationMethod === 'PERCENTAGE') {
        payload.percentage = parseFloat(percentage) || 0;
      } else if (computationMethod === 'FORMULA') {
        payload.formula = formula.trim();
      }

      const res = await fetch('/api/salary-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create salary rule');
      }

      setShowModal(false);
      setName('');
      setCode('');
      setCategory('ALLOWANCE');
      setComputationMethod('FIXED');
      setFixedAmount('0');
      await fetchRules();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Salary Rules Catalog</h1>
          <p className="text-sm text-slate-500">
            Define components for earnings, deductions, fixed allowances, percentages, and formula-based rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/payroll/structures"
            className="inline-flex items-center px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition shadow-sm"
          >
            <Layers className="w-4 h-4 mr-2 text-indigo-600" />
            Salary Structures
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Salary Rule
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by rule name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap">
            Category:
          </span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-slate-700"
          >
            <option value="ALL">All Categories</option>
            <option value="BASIC">Basic</option>
            <option value="ALLOWANCE">Allowance</option>
            <option value="GROSS">Gross</option>
            <option value="DEDUCTION">Deduction</option>
            <option value="NET">Net</option>
          </select>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Rule Name</th>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Computation Method</th>
                <th className="py-3 px-4">Computation Value / Formula</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                    Loading salary rules...
                  </td>
                </tr>
              ) : filteredRules.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                    No rules found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredRules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{rule.name}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-indigo-600">
                      {rule.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                          rule.category === 'BASIC'
                            ? 'bg-blue-50 text-blue-700'
                            : rule.category === 'ALLOWANCE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : rule.category === 'DEDUCTION'
                            ? 'bg-rose-50 text-rose-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {rule.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 font-medium">
                        {rule.computationMethod === 'FIXED' && <DollarSign className="w-3.5 h-3.5 text-slate-400" />}
                        {rule.computationMethod === 'PERCENTAGE' && <Percent className="w-3.5 h-3.5 text-slate-400" />}
                        {rule.computationMethod === 'FORMULA' && <Code className="w-3.5 h-3.5 text-slate-400" />}
                        {rule.computationMethod}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs">
                      {rule.computationMethod === 'FIXED' && (
                        <span className="text-slate-800 font-medium">
                          ${rule.fixedAmount !== null && rule.fixedAmount !== undefined ? rule.fixedAmount.toFixed(2) : '0.00'}
                        </span>
                      )}
                      {rule.computationMethod === 'PERCENTAGE' && (
                        <span className="text-slate-800 font-medium">
                          {rule.percentage}% of Base Wage
                        </span>
                      )}
                      {rule.computationMethod === 'FORMULA' && (
                        <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 font-medium">
                          {rule.formula}
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

      {/* Create Salary Rule Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create New Salary Rule">
        <form onSubmit={handleCreateRule} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Rule Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Travel Allowance or Health Insurance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Rule Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. TRAV_ALW"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500 uppercase"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e: any) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="BASIC">BASIC</option>
                <option value="ALLOWANCE">ALLOWANCE</option>
                <option value="GROSS">GROSS</option>
                <option value="DEDUCTION">DEDUCTION</option>
                <option value="NET">NET</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Computation Method *
            </label>
            <select
              value={computationMethod}
              onChange={(e: any) => setComputationMethod(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="FIXED">Fixed Amount ($)</option>
              <option value="PERCENTAGE">Percentage (%) of Base</option>
              <option value="FORMULA">Python / Math Formula Expression</option>
            </select>
          </div>

          {computationMethod === 'FIXED' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Fixed Amount ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={fixedAmount}
                onChange={(e) => setFixedAmount(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {computationMethod === 'PERCENTAGE' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Percentage (%) *
              </label>
              <input
                type="number"
                step="0.1"
                required
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          )}

          {computationMethod === 'FORMULA' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Formula Expression *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. BASIC * 0.12 or GROSS - DED"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-xs text-slate-400 mt-1">
                Can reference preceding rule codes like BASIC, HRA, etc.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Rule'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
