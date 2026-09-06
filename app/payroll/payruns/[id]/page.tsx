'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  Send,
  Download,
  CreditCard,
  FileText,
  Calendar,
  Layers,
  Users,
  Search,
  ExternalLink,
  DollarSign,
  ShieldAlert,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { AppShell } from '@/components/layout/AppShell';

interface PayslipLine {
  id: string;
  code: string;
  name: string;
  category: string;
  amount: number;
  sequence: number;
}

interface EnrichedPayslip {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  workEmail: string;
  workedDays: number;
  basic: number;
  gross: number;
  allowances: number;
  deductions: number;
  net: number;
  contractStatus: string;
  contractWage: number;
  warnings: string[];
  lines: PayslipLine[];
}

interface PayrunDetail {
  id: string;
  name: string;
  periodStart: string;
  periodEnd: string;
  paymentDate: string | null;
  status: 'DRAFT' | 'COMPUTED' | 'VALIDATED' | 'PAID' | 'CANCELLED';
  salaryStructure: {
    id: string;
    name: string;
    description: string | null;
  };
  payslips: EnrichedPayslip[];
  summary: {
    totalEmployees: number;
    totalGross: number;
    totalAllowances: number;
    totalDeductions: number;
    totalNet: number;
    warningCount: number;
  };
}

export default function PayrunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [payrun, setPayrun] = useState<PayrunDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchPayrun = async () => {
    try {
      setLoading(true);
      setError(null);

      let token =
        typeof window !== 'undefined'
          ? localStorage.getItem('peoplepay_token') || localStorage.getItem('token')
          : null;

      if (!token && typeof window !== 'undefined') {
        try {
          const authRes = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'hr@peoplepay360.com', password: 'password123' }),
          });
          if (authRes.ok) {
            const authData = await authRes.json();
            if (authData.token) {
              token = authData.token;
              localStorage.setItem('token', authData.token);
              localStorage.setItem('peoplepay_token', authData.token);
            }
          }
        } catch {}
      }

      const headers: Record<string, string> = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let res = await fetch(`/api/payruns/${id}`, { headers });

      if (res.status === 401 && typeof window !== 'undefined') {
        const reauth = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'hr@peoplepay360.com', password: 'password123' }),
        });
        if (reauth.ok) {
          const data = await reauth.json();
          if (data.token) {
            token = data.token;
            localStorage.setItem('token', data.token);
            localStorage.setItem('peoplepay_token', data.token);
            headers['Authorization'] = `Bearer ${token}`;
            res = await fetch(`/api/payruns/${id}`, { headers });
          }
        }
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to fetch payrun details');
      }

      const data = await res.json();
      // Format to ensure frontend matches both flat and nested responses
      const p = data.payrun || data;
      const payslipsList = (data.payslips || p.payslips || []).map((ps: any) => ({
        id: ps.id,
        employeeId: ps.employeeId,
        employeeName: ps.employee ? `${ps.employee.firstName} ${ps.employee.lastName}` : (ps.employeeName || 'Staff Member'),
        department: ps.employee?.department || ps.department || 'General',
        workEmail: ps.employee?.workEmail || ps.workEmail || 'employee@company.com',
        workedDays: ps.workedDays || 0,
        basic: ps.basic || 0,
        gross: ps.gross || 0,
        allowances: ps.allowances || 0,
        deductions: ps.deductions || 0,
        net: ps.netSalary !== undefined ? ps.netSalary : (ps.net || 0),
        contractStatus: ps.contract?.status || ps.contractStatus || 'ACTIVE',
        contractWage: ps.contract?.wage || ps.contractWage || 0,
        warnings: ps.warnings || [],
        lines: ps.lines || [],
      }));

      const summary = data.metrics || {
        totalEmployees: payslipsList.length,
        totalGross: payslipsList.reduce((s: number, x: any) => s + x.gross, 0),
        totalAllowances: payslipsList.reduce((s: number, x: any) => s + x.allowances, 0),
        totalDeductions: payslipsList.reduce((s: number, x: any) => s + x.deductions, 0),
        totalNet: payslipsList.reduce((s: number, x: any) => s + x.net, 0),
        warningCount: payslipsList.filter((x: any) => x.warnings && x.warnings.length > 0).length,
      };

      setPayrun({
        id: p.id,
        name: p.name,
        periodStart: p.periodStart,
        periodEnd: p.periodEnd,
        paymentDate: p.paymentDate || null,
        status: p.status,
        salaryStructure: p.salaryStructure || p.structure || { id: '', name: 'Standard Structure', description: null },
        payslips: payslipsList,
        summary: {
          totalEmployees: summary.totalPayslips || summary.totalEmployees || payslipsList.length,
          totalGross: summary.totalGross || 0,
          totalAllowances: summary.totalAllowances || 0,
          totalDeductions: summary.totalDeductions || 0,
          totalNet: summary.totalNet || 0,
          warningCount: summary.warningCount || 0,
        },
      });
    } catch (err: any) {
      setError(err.message || 'Error loading payrun');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayrun();
  }, [id]);

  const handleCompute = async () => {
    if (!confirm('Re-compute all salary rules and payslips for this payrun?')) return;
    try {
      setActionLoading('compute');
      setError(null);
      setSuccessMsg(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('peoplepay_token') || localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/payruns/${id}/compute`, { method: 'POST', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Computation failed');
      setSuccessMsg('Payrun computed successfully!');
      await fetchPayrun();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusChange = async (newStatus: 'VALIDATED' | 'PAID') => {
    const actionLabel = newStatus === 'VALIDATED' ? 'validate' : 'mark as paid';
    if (!confirm(`Are you sure you want to ${actionLabel} this payrun?`)) return;
    try {
      setActionLoading(newStatus.toLowerCase());
      setError(null);
      setSuccessMsg(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('peoplepay_token') || localStorage.getItem('token') : null;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/payruns/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to update to ${newStatus}`);
      setSuccessMsg(`Payrun marked as ${newStatus} successfully.`);
      await fetchPayrun();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendPayslips = async () => {
    if (!confirm('Send payslips to all employees via email?')) return;
    try {
      setActionLoading('send');
      setError(null);
      setSuccessMsg(null);
      const token = typeof window !== 'undefined' ? localStorage.getItem('peoplepay_token') || localStorage.getItem('token') : null;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/payruns/${id}/send-payslips`, { method: 'POST', headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch emails');
      setSuccessMsg(data.message || 'Payslips dispatched to employees!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="default">Draft</Badge>;
      case 'COMPUTED':
        return <Badge variant="info">Computed</Badge>;
      case 'VALIDATED':
        return <Badge variant="warning">Validated</Badge>;
      case 'PAID':
        return <Badge variant="success">Paid</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelled</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const filteredPayslips = payrun?.payslips.filter((ps) => {
    const q = search.toLowerCase();
    return (
      ps.employeeName.toLowerCase().includes(q) ||
      ps.department.toLowerCase().includes(q) ||
      ps.workEmail.toLowerCase().includes(q)
    );
  }) || [];

  if (loading) {
    return (
      <AppShell
        breadcrumbs={[
          { label: 'Operations' },
          { label: 'Payroll', href: '/payroll' },
          { label: 'Processing' },
        ]}
        title="Payrun Processing"
      >
        <div className="flex justify-center items-center h-80">
          <div className="w-8 h-8 border-4 border-[#71547D] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AppShell>
    );
  }

  if (!payrun) {
    return (
      <AppShell
        breadcrumbs={[
          { label: 'Operations' },
          { label: 'Payroll', href: '/payroll' },
          { label: 'Not Found' },
        ]}
        title="Payrun"
      >
        <div className="p-8 text-center bg-white rounded-xl shadow-2xs border border-[#E8E3EA]">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-[#26232A]">Payrun Not Found</h2>
          <p className="text-[#77717B] mt-1 mb-4">{error || 'Could not load the requested payrun processing details.'}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => fetchPayrun()}
              className="inline-flex items-center px-4 py-2 bg-white border border-[#E8E3EA] hover:bg-[#F9F8FA] text-[#26232A] rounded-lg font-medium text-sm transition"
            >
              Retry
            </button>
            <Link
              href="/payroll"
              className="inline-flex items-center px-4 py-2 bg-[#71547D] hover:bg-[#5D4467] text-white rounded-lg font-medium text-sm transition"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Payroll
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      breadcrumbs={[
        { label: 'Operations' },
        { label: 'Payroll', href: '/payroll' },
        { label: payrun.name },
      ]}
      title={payrun.name}
    >
      <div className="space-y-6">
        {/* Top Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/payroll"
              className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-[#71547D] transition mb-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to All Payruns
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{payrun.name}</h1>
              {getStatusBadge(payrun.status)}
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(payrun.periodStart).toLocaleDateString()} —{' '}
              {new Date(payrun.periodEnd).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              {payrun.salaryStructure.name}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {payrun.status !== 'PAID' && (
            <button
              onClick={handleCompute}
              disabled={!!actionLoading}
              className="inline-flex items-center px-3.5 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition shadow-sm disabled:opacity-50"
            >
              <Calculator className="w-4 h-4 mr-2 text-indigo-600" />
              {actionLoading === 'compute' ? 'Computing...' : 'Compute Salary'}
            </button>
          )}

          {payrun.status === 'COMPUTED' && (
            <button
              onClick={() => handleStatusChange('VALIDATED')}
              disabled={!!actionLoading}
              className="inline-flex items-center px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {actionLoading === 'validated' ? 'Validating...' : 'Validate Payrun'}
            </button>
          )}

          {payrun.status === 'VALIDATED' && (
            <button
              onClick={() => handleStatusChange('PAID')}
              disabled={!!actionLoading}
              className="inline-flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              {actionLoading === 'paid' ? 'Processing...' : 'Mark as Paid'}
            </button>
          )}

          {(payrun.status === 'VALIDATED' || payrun.status === 'PAID') && (
            <button
              onClick={handleSendPayslips}
              disabled={!!actionLoading}
              className="inline-flex items-center px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-sm font-medium transition shadow-sm disabled:opacity-50"
            >
              <Send className="w-4 h-4 mr-2 text-emerald-400" />
              {actionLoading === 'send' ? 'Sending...' : 'Send Payslips'}
            </button>
          )}
        </div>
      </div>

      {/* Notifications / Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800 text-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{successMsg}</div>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Employees
            </span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {payrun.summary.totalEmployees}
          </div>
          <div className="text-xs text-slate-400 mt-1">Included in this pay cycle</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Gross Pay
            </span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            ${payrun.summary.totalGross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">Earnings before deductions</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Deductions
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            ${payrun.summary.totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">Taxes, PF & voluntary deductions</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Net Payable
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            ${payrun.summary.totalNet.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-400 mt-1">Actual disbursable salary</div>
        </div>
      </div>

      {/* Warnings Banner if any */}
      {payrun.summary.warningCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-amber-900">
              {payrun.summary.warningCount} Employee Warnings Detected
            </h4>
            <p className="text-xs text-amber-800 mt-0.5">
              Some payslips have irregularities such as missing active contracts or zero net pay.
              Review the warning badges in the table below before validating.
            </p>
          </div>
        </div>
      )}

      {/* Payslips Table Section */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900">Generated Payslips</h3>
            <p className="text-xs text-slate-500">
              Individual breakdown of worked days, earnings, deductions and net pay
            </p>
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search employee or dept..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Contract Status</th>
                <th className="py-3 px-4 text-center">Worked Days</th>
                <th className="py-3 px-4 text-right">Gross Pay</th>
                <th className="py-3 px-4 text-right">Deductions</th>
                <th className="py-3 px-4 text-right">Net Pay</th>
                <th className="py-3 px-4 text-center">Status / Warning</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPayslips.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400 text-sm">
                    No payslips found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredPayslips.map((ps) => (
                  <tr key={ps.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{ps.employeeName}</div>
                      <div className="text-xs text-slate-400">{ps.workEmail}</div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{ps.department}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          ps.contractStatus === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'bg-amber-50 text-amber-700'
                        }`}
                      >
                        {ps.contractStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-700 font-medium">
                      {ps.workedDays}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      ${ps.gross.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-rose-600">
                      ${ps.deductions.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      ${ps.net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {ps.warnings && ps.warnings.length > 0 ? (
                        <span
                          title={ps.warnings.join('; ')}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-xs font-medium"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          {ps.warnings.length} alert{ps.warnings.length > 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-xs text-emerald-600 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                          Clean
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/payroll/payslips/${ps.id}`}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-md transition"
                      >
                        <FileText className="w-3.5 h-3.5 mr-1" />
                        View Slip
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </AppShell>
  );
}
