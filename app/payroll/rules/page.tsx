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
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Badge, BadgeVariant } from '@/components/ui/Badge';
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

  const fetchRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/salary-rules', { headers: authHeaders() });
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
        headers: authHeaders({ 'Content-Type': 'application/json' }),
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

  const getCategoryBadgeVariant = (cat: string): BadgeVariant => {
    switch (cat) {
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

  const filteredRules = rules.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || r.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Operations' },
        { label: 'Payroll', href: '/payroll' },
        { label: 'Salary Rules' },
      ]}
      title="Salary Rules Catalog"
      actions={
        <div className="flex items-center gap-2">
          <Link href="/payroll/structures">
            <Button variant="outline" size="sm">
              <Layers className="w-3.5 h-3.5 text-[#71547D]" />
              <span>Salary Structures</span>
            </Button>
          </Link>
          {canManage && (
            <Button size="sm" onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4" />
              <span>New Salary Rule</span>
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-6">
        {/* Filter and Search Bar */}
        <div className="bg-white p-4 rounded-xl border border-[#E8E3EA] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#77717B]" />
            <input
              type="text"
              placeholder="Search by rule name or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#FAF9FB] border border-[#E8E3EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 focus:border-[#9B7FA6] focus:bg-white transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs font-semibold text-[#77717B] uppercase tracking-wider whitespace-nowrap">
              Category:
            </span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 text-sm bg-[#FAF9FB] border border-[#E8E3EA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 focus:border-[#9B7FA6] font-medium text-[#26232A] transition-colors"
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
        <div className="bg-white rounded-xl border border-[#E8E3EA] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-[#FAF9FB] border-b border-[#E8E3EA] text-xs font-semibold text-[#77717B]">
                  <th className="py-3 px-4">Rule Name</th>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Computation Method</th>
                  <th className="py-3 px-4 text-right">Computation Value / Formula</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E3EA]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#77717B] text-xs">
                      Loading salary rules...
                    </td>
                  </tr>
                ) : filteredRules.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#77717B] text-xs">
                      No rules found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-[#FAF9FB]/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-[#26232A]">{rule.name}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-[#71547D]">
                        {rule.code}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={getCategoryBadgeVariant(rule.category)} size="sm">
                          {rule.category}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-xs text-[#555259] font-medium">
                          {rule.computationMethod === 'FIXED' && <DollarSign className="w-3.5 h-3.5 text-[#77717B]" />}
                          {rule.computationMethod === 'PERCENTAGE' && <Percent className="w-3.5 h-3.5 text-[#77717B]" />}
                          {rule.computationMethod === 'FORMULA' && <Code className="w-3.5 h-3.5 text-[#77717B]" />}
                          {rule.computationMethod}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-xs">
                        {rule.computationMethod === 'FIXED' && (
                          <span className="text-[#26232A] font-semibold">
                            ${rule.fixedAmount !== null && rule.fixedAmount !== undefined ? rule.fixedAmount.toFixed(2) : '0.00'}
                          </span>
                        )}
                        {rule.computationMethod === 'PERCENTAGE' && (
                          <span className="text-[#26232A] font-semibold">
                            {rule.percentage}% of Base Wage
                          </span>
                        )}
                        {rule.computationMethod === 'FORMULA' && (
                          <span className="text-[#71547D] bg-[#F1EBF3] px-2 py-0.5 rounded border border-[#E0D3E3] font-mono font-medium">
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
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title="Create New Salary Rule"
          description="Configure computation rules for earnings, deductions, or statutory formulas"
        >
          <form onSubmit={handleCreateRule} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#26232A] mb-1.5">
                Rule Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Travel Allowance or Health Insurance"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-[#E8E3EA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 focus:border-[#9B7FA6] transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#26232A] mb-1.5">
                  Rule Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TRAV_ALW"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-[#E8E3EA] rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 focus:border-[#9B7FA6] uppercase transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#26232A] mb-1.5">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(e: any) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E8E3EA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 focus:border-[#9B7FA6] bg-white text-[#26232A] transition-colors"
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
              <label className="block text-xs font-semibold text-[#26232A] mb-1.5">
                Computation Method *
              </label>
              <select
                value={computationMethod}
                onChange={(e: any) => setComputationMethod(e.target.value)}
                className="w-full px-3 py-2 border border-[#E8E3EA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 focus:border-[#9B7FA6] bg-white text-[#26232A] transition-colors"
              >
                <option value="FIXED">Fixed Amount ($)</option>
                <option value="PERCENTAGE">Percentage (%) of Base</option>
                <option value="FORMULA">Python / Math Formula Expression</option>
              </select>
            </div>

            {computationMethod === 'FIXED' && (
              <div>
                <label className="block text-xs font-semibold text-[#26232A] mb-1.5">
                  Fixed Amount ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={fixedAmount}
                  onChange={(e) => setFixedAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E8E3EA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 focus:border-[#9B7FA6] transition-colors"
                />
              </div>
            )}

            {computationMethod === 'PERCENTAGE' && (
              <div>
                <label className="block text-xs font-semibold text-[#26232A] mb-1.5">
                  Percentage (%) *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E8E3EA] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 focus:border-[#9B7FA6] transition-colors"
                />
              </div>
            )}

            {computationMethod === 'FORMULA' && (
              <div>
                <label className="block text-xs font-semibold text-[#26232A] mb-1.5">
                  Formula Expression *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BASIC * 0.12 or GROSS - DED"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E8E3EA] rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 focus:border-[#9B7FA6] transition-colors"
                />
                <p className="text-[11px] text-[#77717B] mt-1">
                  Can reference preceding rule codes like BASIC, HRA, etc.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-[#E8E3EA]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={submitting}
              >
                Create Rule
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}