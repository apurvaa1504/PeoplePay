import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-md transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const sizeStyles = {
    sm: "px-2.5 py-1.5 text-xs gap-1.5",
    md: "px-3.5 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5",
  };

  const variantStyles = {
    primary:
      "bg-[#9B7FA6] hover:bg-[#886B94] text-white shadow-xs focus:ring-[#9B7FA6]/40 border border-transparent",
    secondary:
      "bg-[#F1EBF3] hover:bg-[#E8DFEC] text-[#55405F] focus:ring-[#9B7FA6]/30 border border-transparent",
    outline:
      "bg-white hover:bg-[#F9F8FA] text-[#26232A] border border-[#E8E3EA] hover:border-[#DCD4DF] shadow-2xs focus:ring-[#9B7FA6]/30",
    ghost:
      "bg-transparent hover:bg-[#F1EBF3]/60 text-[#77717B] hover:text-[#26232A] focus:ring-[#9B7FA6]/20",
    danger:
      "bg-[#B56767] hover:bg-[#9E5555] text-white shadow-xs focus:ring-[#B56767]/30 border border-transparent",
  };

  return (
    <button
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin h-4 w-4 mr-1 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
