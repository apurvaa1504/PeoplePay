"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
    ArrowLeft,
    Calendar,
    CheckCircle2,
    CreditCard,
    AlertCircle,
    Loader2,
    Users,
    IndianRupee,
    FileText,
} from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type PayrunStatus = "DRAFT" | "COMPUTED" | "VALIDATED" | "PAID";

interface Employee {
    id: string;
    firstName: string;
    lastName: string;
}

interface PayslipSummary {
    id: string;
    employeeId: string;
    contractId: string;
    netSalary: number;
    workedDays: number;
    warnings: string | null;
    employee?: Employee;
}

interface Payrun {
    id: string;
    name: string;
    structureId: string;
    periodStart: string;
    periodEnd: string;
    status: PayrunStatus;
    createdAt: string;
}

interface PayrunDetailsResponse {
    payrun: Payrun;
    structureName: string;
    payslips: PayslipSummary[];
    summary: {
        employeeCount: number;
        totalNetSalary: number;
        warningCount: number;
    };
}

export default function PayrunDetailsPage() {
    const params = useParams<{ id: string }>();
    const payrunId = params.id;

    const [data, setData] = useState<PayrunDetailsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    const getHeaders = (): HeadersInit => {
        const token =
            typeof window !== "undefined"
                ? localStorage.getItem("peoplepay_token")
                : null;

        return token
            ? { Authorization: `Bearer ${token}` }
            : {};
    };

    const fetchPayrun = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/payruns/${payrunId}`, {
                headers: getHeaders(),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Failed to fetch payrun");
            }

            setData(result);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to load payrun"
            );
        } finally {
            setLoading(false);
        }
    }, [payrunId]);

    useEffect(() => {
        if (!payrunId) {
            return;
        }

        const loadPayrun = async () => {
            await fetchPayrun();
        };

        const timer = setTimeout(() => {
            void loadPayrun();
        }, 0);

        return () => clearTimeout(timer);
    }, [payrunId, fetchPayrun]);

    const handleValidate = async () => {
        try {
            setActionLoading(true);
            setActionError(null);

            const response = await fetch(`/api/payruns/${payrunId}/validate`, {
                method: "POST",
                headers: {
                    ...getHeaders(),
                    "Content-Type": "application/json",
                },
            });

            const result = await response.json();

            if (!response.ok) {
                const validationErrors = Array.isArray(result.errors)
                    ? result.errors.join(" ")
                    : result.error;

                throw new Error(
                    validationErrors || "Failed to validate payrun"
                );
            }

            await fetchPayrun();
        } catch (err) {
            setActionError(
                err instanceof Error ? err.message : "Failed to validate payrun"
            );
        } finally {
            setActionLoading(false);
        }
    };

    const handleMarkPaid = async () => {
        try {
            setActionLoading(true);
            setActionError(null);

            const response = await fetch(`/api/payruns/${payrunId}/mark-paid`, {
                method: "POST",
                headers: {
                    ...getHeaders(),
                    "Content-Type": "application/json",
                },
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.error || "Failed to mark payrun as paid"
                );
            }

            await fetchPayrun();
        } catch (err) {
            setActionError(
                err instanceof Error
                    ? err.message
                    : "Failed to mark payrun as paid"
            );
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (value: string) =>
        new Date(value).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });

    const formatCurrency = (value: number) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(value);

    const getStatusVariant = (status: PayrunStatus) => {
        switch (status) {
            case "DRAFT":
                return "default";
            case "COMPUTED":
                return "info";
            case "VALIDATED":
                return "warning";
            case "PAID":
                return "success";
        }
    };

    if (loading) {
        return (
            <AppShell
                breadcrumbs={[
                    { label: "Operations" },
                    { label: "Payroll" },
                    { label: "Payrun" },
                ]}
                title="Payrun Details"
            >
                <div className="flex min-h-[300px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-[#9B7FA6]" />
                </div>
            </AppShell>
        );
    }

    if (error || !data) {
        return (
            <AppShell
                breadcrumbs={[
                    { label: "Operations" },
                    { label: "Payroll" },
                    { label: "Payrun" },
                ]}
                title="Payrun Details"
            >
                <div className="rounded-lg border border-[#E8E3EA] bg-white p-6">
                    <div className="flex items-center gap-2 text-[#B56767]">
                        <AlertCircle className="h-5 w-5" />
                        <span>{error || "Payrun not found"}</span>
                    </div>

                    <Link
                        href="/payroll"
                        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#71547D]"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Payroll
                    </Link>
                </div>
            </AppShell>
        );
    }

    const { payrun, structureName, payslips, summary } = data;

    return (
        <AppShell
            breadcrumbs={[
                { label: "Operations" },
                { label: "Payroll" },
                { label: payrun.name },
            ]}
            title={payrun.name}
            actions={
                <div className="flex items-center gap-2">
                    <Link href="/payroll">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                    </Link>

                    {payrun.status === "COMPUTED" && (
                        <Button
                            size="sm"
                            onClick={handleValidate}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4" />
                            )}
                            Validate
                        </Button>
                    )}

                    {payrun.status === "VALIDATED" && (
                        <Button
                            size="sm"
                            onClick={handleMarkPaid}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <CreditCard className="h-4 w-4" />
                            )}
                            Mark Paid
                        </Button>
                    )}
                </div>
            }
        >
            <div className="space-y-5">
                {actionError && (
                    <div className="rounded-lg border border-[#F0D3D3] bg-[#FAECEC] px-4 py-3 text-sm text-[#B56767]">
                        {actionError}
                    </div>
                )}

                {/* Payrun Summary */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-lg border border-[#E8E3EA] bg-white p-5 shadow-2xs">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#77717B]">
                            Status
                        </div>

                        <div className="mt-2">
                            <Badge
                                variant={getStatusVariant(payrun.status)}
                                size="sm"
                            >
                                {payrun.status}
                            </Badge>
                        </div>
                    </div>

                    <div className="rounded-lg border border-[#E8E3EA] bg-white p-5 shadow-2xs">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#77717B]">
                            Period
                        </div>

                        <div className="mt-2 flex items-center gap-2 text-sm font-medium text-[#26232A]">
                            <Calendar className="h-4 w-4 text-[#9B7FA6]" />
                            {formatDate(payrun.periodStart)} –{" "}
                            {formatDate(payrun.periodEnd)}
                        </div>
                    </div>

                    <div className="rounded-lg border border-[#E8E3EA] bg-white p-5 shadow-2xs">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#77717B]">
                            Salary Structure
                        </div>

                        <div className="mt-2 text-sm font-semibold text-[#26232A]">
                            {structureName}
                        </div>
                    </div>

                    <div className="rounded-lg border border-[#E8E3EA] bg-white p-5 shadow-2xs">
                        <div className="text-[10px] font-semibold uppercase tracking-wider text-[#77717B]">
                            Payrun ID
                        </div>

                        <div className="mt-2 truncate font-mono text-xs text-[#524E57]">
                            {payrun.id}
                        </div>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-lg border border-[#E8E3EA] bg-white p-5 shadow-2xs">
                        <div className="flex items-center gap-2 text-[#77717B]">
                            <Users className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider">
                                Employees
                            </span>
                        </div>

                        <div className="mt-2 text-2xl font-semibold text-[#26232A]">
                            {summary.employeeCount}
                        </div>
                    </div>

                    <div className="rounded-lg border border-[#E8E3EA] bg-white p-5 shadow-2xs">
                        <div className="flex items-center gap-2 text-[#77717B]">
                            <IndianRupee className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider">
                                Total Net Salary
                            </span>
                        </div>

                        <div className="mt-2 text-2xl font-semibold text-[#26232A]">
                            {formatCurrency(summary.totalNetSalary)}
                        </div>
                    </div>

                    <div className="rounded-lg border border-[#E8E3EA] bg-white p-5 shadow-2xs">
                        <div className="flex items-center gap-2 text-[#77717B]">
                            <AlertCircle className="h-4 w-4" />
                            <span className="text-xs font-semibold uppercase tracking-wider">
                                Warnings
                            </span>
                        </div>

                        <div className="mt-2 text-2xl font-semibold text-[#26232A]">
                            {summary.warningCount}
                        </div>
                    </div>
                </div>

                {/* Payslips */}
                <div className="overflow-hidden rounded-lg border border-[#E8E3EA] bg-white shadow-2xs">
                    <div className="flex items-center justify-between border-b border-[#E8E3EA] px-5 py-4">
                        <div>
                            <h2 className="text-sm font-semibold text-[#26232A]">
                                Payslips
                            </h2>

                            <p className="mt-0.5 text-xs text-[#77717B]">
                                Generated payslips for employees in this payrun
                            </p>
                        </div>

                        <FileText className="h-5 w-5 text-[#9B7FA6]" />
                    </div>

                    {payslips.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <p className="text-sm font-medium text-[#26232A]">
                                No payslips generated
                            </p>

                            <p className="mt-1 text-xs text-[#77717B]">
                                This payrun does not contain any generated payslips.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#F9F8FA]">
                                    <tr className="border-b border-[#E8E3EA]">
                                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#77717B]">
                                            Employee
                                        </th>

                                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#77717B]">
                                            Worked Days
                                        </th>

                                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[#77717B]">
                                            Net Salary
                                        </th>

                                        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wider text-[#77717B]">
                                            Status
                                        </th>

                                        <th className="px-4 py-3 text-right text-[10px] font-semibold uppercase tracking-wider text-[#77717B]">
                                            Action
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {payslips.map((payslip) => (
                                        <tr
                                            key={payslip.id}
                                            className="border-b border-[#E8E3EA] last:border-b-0"
                                        >
                                            <td className="px-4 py-4">
                                                <div className="text-sm font-medium text-[#26232A]">
                                                    {payslip.employee
                                                        ? `${payslip.employee.firstName} ${payslip.employee.lastName}`
                                                        : payslip.employeeId}
                                                </div>

                                                <div className="mt-0.5 text-xs text-[#77717B]">
                                                    Payslip ID: {payslip.id}
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 text-sm text-[#524E57]">
                                                {payslip.workedDays}
                                            </td>

                                            <td className="px-4 py-4 text-right text-sm font-semibold text-[#26232A]">
                                                {formatCurrency(payslip.netSalary)}
                                            </td>

                                            <td className="px-4 py-4">
                                                {payslip.warnings ? (
                                                    <Badge variant="warning" size="sm">
                                                        Warning
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="success" size="sm">
                                                        Ready
                                                    </Badge>
                                                )}
                                            </td>

                                            <td className="px-4 py-4 text-right">
                                                <Link
                                                    href={`/payroll/payslips/${payslip.id}`}
                                                    className="text-sm font-medium text-[#71547D] hover:underline"
                                                >
                                                    View Payslip
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AppShell>
    );
}