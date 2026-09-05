"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  React.useEffect(() => {
    // Generate valid session token for Person A (HR_MANAGER) if missing
    if (typeof window !== "undefined" && !localStorage.getItem("peoplepay_token")) {
      fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "hr_manager@peoplepay.com", password: "demo" }),
      }).catch(() => {});
    }
  }, []);

  const navSections = [
    {
      title: "WORKSPACE",
      items: [
        {
          name: "Overview",
          href: "/dashboard",
          icon: LayoutDashboard,
          future: true,
        },
      ],
    },
    {
      title: "PEOPLE",
      items: [
        {
          name: "Employees",
          href: "/employees",
          icon: Users,
          activePatterns: ["/employees"],
        },
        {
          name: "Contracts",
          href: "/contracts",
          icon: FileText,
          activePatterns: ["/contracts"],
        },
      ],
    },
    {
      title: "OPERATIONS",
      items: [
        {
          name: "Working Schedules",
          href: "/schedules",
          icon: Calendar,
          activePatterns: ["/schedules"],
        },
        {
          name: "Attendance",
          href: "/attendance",
          icon: Clock,
          activePatterns: ["/attendance"],
        },
        {
          name: "Time Off",
          href: "/time-off",
          icon: Palmtree,
          future: true,
        },
        {
          name: "Payroll",
          href: "/payroll",
          icon: CreditCard,
          future: true,
        },
      ],
    },
  ];

  const isItemActive = (item: { href: string; activePatterns?: string[] }) => {
    if (item.activePatterns) {
      return item.activePatterns.some((pattern) => pathname.startsWith(pattern));
    }
    return pathname === item.href;
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-white border-r border-[#E8E3EA] w-[232px]">
      <div className="flex flex-col flex-1 overflow-y-auto">
        {/* Logo / Brand */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-[#E8E3EA]/80">
          <Link href="/employees" className="flex items-center gap-2.5">
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
                {section.items.map((item) => {
                  const active = isItemActive(item);
                  const Icon = item.icon;

                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={`group flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
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
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* User / Account Section at bottom */}
      <div className="p-3 border-t border-[#E8E3EA] bg-[#FCFBFD]">
        <div className="flex items-center gap-2.5 p-2 rounded-md hover:bg-white transition-colors border border-transparent hover:border-[#E8E3EA]">
          <div className="w-7 h-7 rounded-full bg-[#E8DFEC] text-[#71547D] text-xs font-semibold flex items-center justify-center">
            PA
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-[#26232A] truncate">
              Person A
            </span>
            <span className="text-[10px] text-[#77717B] truncate">
              HR Manager
            </span>
          </div>
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