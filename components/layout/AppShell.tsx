"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Auth guard on protected app pages
    const publicPaths = ["/login", "/signup"];
    if (publicPaths.includes(pathname)) {
      setIsAuthenticated(true);
      return;
    }

    const token = localStorage.getItem("token") || localStorage.getItem("peoplepay_token");
    if (!token) {
      router.replace("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname, router]);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FCFBFD]">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-2 border-[#9B7FA6] border-t-transparent animate-spin" />
          <p className="text-xs text-[#77717B]">Verifying session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FCFBFD]">
      <Sidebar isOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
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