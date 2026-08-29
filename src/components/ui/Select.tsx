"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
}

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, options, error, id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1.5 ml-1 tracking-wide"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "w-full appearance-none rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-white/10 px-4 py-2.5 pr-10 text-sm text-neutral-900 dark:text-neutral-100 transition-all duration-200 focus:bg-white dark:focus:bg-neutral-900 focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20 focus:outline-none cursor-pointer",
              error && "border-red-500",
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option
                key={opt.value}
                value={opt.value}
                className="bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100"
              >
                {opt.label} {opt.sublabel ? `(${opt.sublabel})` : ""}
              </option>
            ))}
          </select>
          <div className="absolute right-3.5 pointer-events-none text-neutral-400">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error && (
          <p className="mt-1.5 ml-1 text-xs text-red-500 font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
