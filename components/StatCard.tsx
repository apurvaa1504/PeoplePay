import React from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  icon?: React.ReactNode;
  variant?: "default" | "purple" | "green" | "blue" | "amber";
}

export function StatCard({
  title,
  value,
  description,
  trend,
  icon,
  variant = "default",
}: StatCardProps) {
  const iconBgMap = {
    default: "bg-[#F1EBF3] text-[#71547D]",
    purple: "bg-[#F1EBF3] text-[#71547D]",
    green: "bg-[#EDF4EE] text-[#3D6B49]",
    blue: "bg-[#EDF2F7] text-[#4F6785]",
    amber: "bg-[#FBF4E8] text-[#866332]",
  };

  return (
    <div className="bg-white p-5 rounded-lg border border-[#E8E3EA] shadow-2xs hover:shadow-xs transition-shadow">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[#77717B]">{title}</span>
        {icon && (
          <div className={`w-8 h-8 rounded-md flex items-center justify-center ${iconBgMap[variant]}`}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight text-[#26232A]">{value}</span>
        {trend && (
          <span
            className={`text-[11px] font-semibold ${
              trend.isPositive ? "text-[#3D6B49]" : "text-[#B56767]"
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>

      {description && (
        <p className="mt-1 text-xs text-[#A49FA8] line-clamp-1">{description}</p>
      )}
    </div>
  );
}

export default StatCard;
