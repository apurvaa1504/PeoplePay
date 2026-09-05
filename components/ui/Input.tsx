import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  id,
  className = "",
  ...props
}: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-[#524E57] uppercase tracking-wider mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-[#26232A] placeholder:text-[#A49FA8] transition-colors focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 focus:border-[#9B7FA6] disabled:bg-[#F9F8FA] disabled:text-[#A49FA8] ${
          error ? "border-[#B56767]" : "border-[#E8E3EA] hover:border-[#DCD4DF]"
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-[#B56767] font-medium">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-xs text-[#77717B]">{helperText}</p>
      )}
    </div>
  );
}
