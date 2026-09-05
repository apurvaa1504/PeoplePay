import React from "react";
import { Button } from "./Button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-12 bg-white rounded-lg border border-dashed border-[#DCD4DF] my-4">
      {icon && (
        <div className="w-12 h-12 rounded-full bg-[#F1EBF3] flex items-center justify-center text-[#9B7FA6] mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[#26232A] mb-1">{title}</h3>
      <p className="text-sm text-[#77717B] max-w-sm mb-5">{description}</p>
      {actionLabel && (
        <>
          {actionHref ? (
            <a
              href={actionHref}
              className="inline-flex items-center justify-center font-medium rounded-md px-3.5 py-2 text-sm bg-[#9B7FA6] hover:bg-[#886B94] text-white transition-all shadow-xs"
            >
              {actionLabel}
            </a>
          ) : (
            <Button variant="primary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
