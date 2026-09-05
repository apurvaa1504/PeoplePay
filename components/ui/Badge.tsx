import React from "react";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md";
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  size = "md",
  className = "",
}: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-[#F3F2F5] text-[#555259] border-[#E8E3EA]",
    success: "bg-[#EDF4EE] text-[#3D6B49] border-[#CCE0D1]",
    warning: "bg-[#FBF4E8] text-[#866332] border-[#EBD6B8]",
    danger: "bg-[#FAECEC] text-[#9A4E4E] border-[#E9C3C3]",
    info: "bg-[#EDF2F7] text-[#4F6785] border-[#CAD6E2]",
    purple: "bg-[#F1EBF3] text-[#71547D] border-[#E0D3E3]",
  };

  const sizeStyles = {
    sm: "px-2 py-0.5 text-[11px] font-medium leading-none",
    md: "px-2.5 py-0.75 text-xs font-medium leading-normal",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          variant === "success"
            ? "bg-[#5D8A6B]"
            : variant === "danger"
            ? "bg-[#B56767]"
            : variant === "warning"
            ? "bg-[#A9824C]"
            : variant === "purple"
            ? "bg-[#9B7FA6]"
            : variant === "info"
            ? "bg-[#687F9C]"
            : "bg-[#8D8892]"
        }`}
      />
      {children}
    </span>
  );
}
