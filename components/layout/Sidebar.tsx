"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Users,
  FileText,
  Calendar,
  Clock,
  LayoutDashboard,
  Palmtree,
  CreditCard,
  Building2,
  X,
  LogOut,
  ChevronDown,
  Layers,
  BookOpen,
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface UserSession {
  id: string;
  email: string;
  role: "EMPLOYEE" | "HR_MANAGER" | "HR_PAYROLL_USER" | "HR_PAYROLL_MANAGER" | "ADMIN" | string;
  employeeId?: string | null;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);
  const [timeOffMenuOpen, setTimeOffMenuOpen] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("user");
        if (stored) {
          const parsed = JSON.parse(stored);
          setCurrentUser(parsed);

          // If role is EMPLOYEE but employeeId is not stored yet, fetch it dynamically
          if (parsed.role === "EMPLOYEE" && !parsed.employeeId && parsed.id) {
            fetch(`/api/employees?userId=${parsed.id}`)
              .then((res) => res.json())
              .then((list) => {
                if (Array.isArray(list) && list.length > 0) {
                  const updated = { ...parsed, employeeId: list[0].id };
                  setCurrentUser(updated);
                  localStorage.setItem("user", JSON.stringify(updated));
                }
              })
              .catch(() => {});
          }
        } else {
          // Fallback if token exists but user metadata wasn't stored
          const token = localStorage.getItem("token") || localStorage.getItem("peoplepay_token");
          if (token) {
            setCurrentUser({ id: "demo", email: "user@peoplepay.com", role: "HR_MANAGER" });
          }
        }
      } catch {
        // Ignore parse error
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("peoplepay_token");
      localStorage.removeItem("user");
    }
    router.replace("/login");
  };

  const role = currentUser?.role || "EMPLOYEE";
  const isAdmin = role === "ADMIN";
  const isHrManager = role === "HR_MANAGER";
  const isPayrollUser = role === "HR_PAYROLL_USER";
  const isPayrollManager = role === "HR_PAYROLL_MANAGER";
  const isEmployee = role === "EMPLOYEE";

  // Role permissions:
  // EMPLOYEE: View own employee details, attendance, leave balances; create attendance entries & Time Off requests. No payroll or HR admin.
  // HR_MANAGER: Full CRUD on Employees, Attendance, Contracts, Working Schedules, Time Off. No payroll.
  // HR_PAYROLL_USER: All HR Manager + CRUD on Payruns & Payslips; Read-only Salary Structures & Rules.
  // HR_PAYROLL_MANAGER: All HR Payroll User + full CRUD on Salary Structures & Rules.
  // ADMIN: Full access to everything.

  const showOverview = !isEmployee;
  const showEmployees = isAdmin || isHrManager || isPayrollUser || isPayrollManager;
  const showContracts = isAdmin || isHrManager || isPayrollUser || isPayrollManager;
  const showSchedules = isAdmin || isHrManager || isPayrollUser || isPayrollManager;
  const showAttendance = true; // All roles can access attendance (Employees create/view own)
  const showTimeOff = true; // All roles access time off (Employees request/view, HR decides/allocates)
  const showPayroll = isAdmin || isPayrollUser || isPayrollManager;

  const navSections = [
    ...(showOverview
      ? [
          {
            title: "WORKSPACE",
            items: [
              {
                name: "Overview",
                href: "/dashboard",
                icon: LayoutDashboard,
                activePatterns: ["/dashboard"],
              },
            ],
          },
        ]
      : []),
    {
      title: isEmployee ? "SELF SERVICE" : "PEOPLE",
      items: [
        ...(showEmployees
          ? [
              {
                name: "Employees",
                href: "/employees",
                icon: Users,
                activePatterns: ["/employees"],
              },
            ]
          : [
              {
                name: "My Details",
                href: currentUser?.employeeId ? `/employees/${currentUser.employeeId}` : "/employees",
                icon: Users,
                activePatterns: ["/employees"],
              },
            ]),
        ...(showContracts
          ? [
              {
                name: "Contracts",
                href: "/contracts",
                icon: FileText,
                activePatterns: ["/contracts"],
              },
            ]
          : []),
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        ...(showSchedules
          ? [
              {
                name: "Working Schedules",
                href: "/schedules",
                icon: Calendar,
                activePatterns: ["/schedules"],
              },
            ]
          : []),
        ...(showAttendance
          ? [
              {
                name: isEmployee ? "My Attendance" : "Attendance",
                href: "/attendance",
                icon: Clock,
                activePatterns: ["/attendance"],
              },
            ]
          : []),
        ...(showTimeOff
          ? [
              {
                name: "Time Off",
                href: "/time-off/requests",
                icon: Palmtree,
                activePatterns: ["/time-off"],
                hasSubmenu: !isEmployee,
                subItems: [
                  { name: "Requests", href: "/time-off/requests" },
                  { name: "Allocations", href: "/time-off/allocations" },
                  ...(isAdmin || isHrManager || isPayrollManager
                    ? [{ name: "Leave Types", href: "/time-off/types" }]
                    : []),
                ],
              },
            ]
          : []),
        ...(showPayroll
          ? [
              {
                name: "Payroll",
                href: "/payroll",
                icon: CreditCard,
                activePatterns: ["/payroll"],
                future: true,
              },
            ]
          : []),
      ],
    },
  ];

  const isItemActive = (item: { href: string; activePatterns?: string[] }) => {
    if (item.activePatterns) {
      return item.activePatterns.some((pattern) => pathname.startsWith(pattern));
    }
    return pathname === item.href;
  };

  const getInitials = (email?: string) => {
    if (!email) return "U";
    const namePart = email.split("@")[0];
    return namePart.substring(0, 2).toUpperCase();
  };

  const formatRoleName = (r?: string) => {
    switch (r) {
      case "ADMIN":
        return "System Admin";
      case "HR_MANAGER":
        return "HR Manager";
      case "HR_PAYROLL_USER":
        return "Payroll User";
      case "HR_PAYROLL_MANAGER":
        return "Payroll Manager";
      case "EMPLOYEE":
        return "Employee";
      default:
        return r || "User";
    }
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-[#E8E3EA] w-[232px]">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Logo / Brand */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-[#E8E3EA]/80">
          <Link href={isEmployee ? "/employees" : "/dashboard"} className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#9B7FA6] flex items-center justify-center text-white shadow-2xs font-semibold">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-[#26232A]">
                People<span className="text-[#9B7FA6]">Pay</span>
              </span>
              <span className="text-[10px] text-[#77717B] font-medium tracking-wide">
                HR & PAYROLL
              </span>
            </div>
          </Link>
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded-md text-[#77717B] hover:text-[#26232A] hover:bg-[#F1EBF3]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="px-3 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title}>
              <h4 className="px-2 mb-1.5 text-[10px] font-bold text-[#A49FA8] tracking-wider uppercase">
                {section.title}
              </h4>
              <ul className="space-y-0.5">
                {section.items.map((item: any) => {
                  const active = isItemActive(item);
                  const Icon = item.icon;

                  return (
                    <li key={item.name} className="flex flex-col">
                      <div className="flex items-center">
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={`group flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all flex-1 ${
                            active
                              ? "bg-[#F1EBF3] text-[#71547D] font-semibold"
                              : "text-[#524E57] hover:bg-[#F9F8FA] hover:text-[#26232A]"
                          }`}
                        >
                          <Icon
                            className={`w-4 h-4 transition-colors ${
                              active
                                ? "text-[#9B7FA6]"
                                : "text-[#77717B] group-hover:text-[#26232A]"
                            }`}
                          />
                          <span>{item.name}</span>
                          {item.future && (
                            <span className="ml-auto text-[9px] px-1.5 py-0.25 rounded bg-[#F3F2F5] text-[#8D8892] font-normal">
                              soon
                            </span>
                          )}
                        </Link>
                        {item.hasSubmenu && (
                          <button
                            onClick={() => setTimeOffMenuOpen(!timeOffMenuOpen)}
                            className="p-1 text-[#77717B] hover:text-[#26232A] transition-transform"
                          >
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform ${
                                timeOffMenuOpen ? "rotate-180" : ""
                              }`}
                            />
                          </button>
                        )}
                      </div>

                      {/* Submenu for Time Off */}
                      {item.hasSubmenu && timeOffMenuOpen && (
                        <div className="ml-7 mt-1 pl-2 border-l border-[#E8E3EA] space-y-1">
                          {item.subItems.map((sub: { name: string; href: string }) => {
                            const subActive = pathname === sub.href;
                            return (
                              <Link
                                key={sub.name}
                                href={sub.href}
                                onClick={onClose}
                                className={`block px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                                  subActive
                                    ? "text-[#71547D] font-semibold bg-[#F1EBF3]"
                                    : "text-[#77717B] hover:text-[#26232A] hover:bg-[#F9F8FA]"
                                }`}
                              >
                                {sub.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* User / Account Section at bottom with Logout */}
      <div className="p-3 border-t border-[#E8E3EA] bg-[#FCFBFD]">
        <div className="flex items-center justify-between p-2 rounded-md hover:bg-white transition-colors border border-transparent hover:border-[#E8E3EA]">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-full bg-[#E8DFEC] text-[#71547D] text-xs font-semibold flex items-center justify-center shrink-0">
              {getInitials(currentUser?.email)}
            </div>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-semibold text-[#26232A] truncate">
                {currentUser?.email?.split("@")[0] || "User"}
              </span>
              <span className="text-[10px] text-[#77717B] truncate font-medium">
                {formatRoleName(currentUser?.role)}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log out"
            className="p-1.5 rounded text-[#77717B] hover:text-[#B56767] hover:bg-[#FAECEC] transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (fixed) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[232px] lg:flex lg:flex-col">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (overlay) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-2xs"
            onClick={onClose}
          />
          <div className="relative z-50 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;