"use client";

import React, { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { Palmtree, Calendar, Layers, Clock } from "lucide-react";

interface TimeOffLayoutProps {
  children: ReactNode;
}

export default function TimeOffLayout({ children }: TimeOffLayoutProps) {
  const pathname = usePathname();

  const tabs = [
    { label: "Requests", href: "/time-off/requests", icon: Clock },
    { label: "Allocations", href: "/time-off/allocations", icon: Calendar },
    { label: "Leave Types", href: "/time-off/types", icon: Layers },
  ];

  return (
    <AppShell
      title="Time Off"
      breadcrumbs={[
        { label: "Operations", href: "/dashboard" },
        { label: "Time Off" },
      ]}
    >
      <div className="space-y-6">
        {/* Sub-navigation Tabs */}
        <div className="flex border-b border-[#E8E3EA] gap-6">
          {tabs.map((tab) => {
            const active = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 pb-3 text-xs font-semibold transition-all border-b-2 ${
                  active
                    ? "border-[#9B7FA6] text-[#71547D]"
                    : "border-transparent text-[#77717B] hover:text-[#26232A]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Tab content */}
        <div>{children}</div>
      </div>
    </AppShell>
  );
}
