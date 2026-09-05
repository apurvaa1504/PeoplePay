"use client";

import React from "react";
import { Search, Bell, Menu } from "lucide-react";

interface TopbarProps {
  breadcrumbs?: { label: string; href?: string }[];
  title?: string;
  onMobileMenuToggle?: () => void;
  actions?: React.ReactNode;
}

export function Topbar({
  breadcrumbs,
  title,
  onMobileMenuToggle,
  actions,
}: TopbarProps) {
  return (
    <header className="h-16 border-b border-[#E8E3EA] bg-white sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3">
        {onMobileMenuToggle && (
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-1.5 rounded-md text-[#77717B] hover:text-[#26232A] hover:bg-[#F1EBF3] transition-colors cursor-pointer"
            aria-label="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="flex flex-col">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="flex items-center gap-1.5 text-[11px] text-[#77717B]">
              {breadcrumbs.map((b, i) => (
                <React.Fragment key={b.label}>
                  {i > 0 && <span>/</span>}
                  {b.href ? (
                    <a
                      href={b.href}
                      className="hover:text-[#26232A] transition-colors"
                    >
                      {b.label}
                    </a>
                  ) : (
                    <span className="text-[#26232A] font-medium">{b.label}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          )}
          {title && (
            <h1 className="text-base sm:text-lg font-bold text-[#26232A] leading-tight">
              {title}
            </h1>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search Input */}
        <div className="relative hidden sm:block w-48 lg:w-64">
          <Search className="w-4 h-4 text-[#A49FA8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search anything..."
            className="w-full rounded-md border border-[#E8E3EA] bg-[#FCFBFD] pl-9 pr-3 py-1.5 text-xs text-[#26232A] placeholder:text-[#A49FA8] transition-colors focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 focus:border-[#9B7FA6]"
          />
        </div>

        {/* Notifications */}
        <button
          className="relative p-2 rounded-md text-[#77717B] hover:text-[#26232A] hover:bg-[#F9F8FA] transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#9B7FA6]" />
        </button>

        {/* Page Actions */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export default Topbar;