import React from "react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
}

export function Select({
  label,
  options,
  error,
  helperText,
  id,
  className = "",
  ...props
}: SelectProps) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-[#524E57] uppercase tracking-wider mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={selectId}
          className={`w-full appearance-none rounded-md border bg-white px-3 py-2 pr-8 text-sm text-[#26232A] transition-colors focus:outline-none focus:ring-2 focus:ring-[#9B7FA6]/30 focus:border-[#9B7FA6] disabled:bg-[#F9F8FA] disabled:text-[#A49FA8] cursor-pointer ${
            error ? "border-[#B56767]" : "border-[#E8E3EA] hover:border-[#DCD4DF]"
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#77717B]">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-[#B56767] font-medium">{error}</p>}
      {helperText && !error && (
        <p className="mt-1 text-xs text-[#77717B]">{helperText}</p>
      )}
    </div>
  );
}
