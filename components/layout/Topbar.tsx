"use client";

import React from "react";
import { Menu } from "lucide-react";

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
        {/* Page Actions */}
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export default Topbar;