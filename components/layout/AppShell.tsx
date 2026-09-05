"use client";

import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

interface AppShellProps {
  children: React.ReactNode;
  breadcrumbs?: { label: string; href?: string }[];
  title?: string;
  actions?: React.ReactNode;
}

export function AppShell({
  children,
  breadcrumbs,
  title,
  actions,
}: AppShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FCFBFD]">
      <Sidebar />
      <div className="lg:pl-[232px] flex flex-col min-h-screen">
        <Topbar
          breadcrumbs={breadcrumbs}
          title={title}
          actions={actions}
          onMobileMenuToggle={() => setMobileNavOpen(!mobileNavOpen)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AppShell;