"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface SliderProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (value: number) => void;
  accentColor?: string;
  label?: string;
  showValue?: boolean;
  valueFormatter?: (val: number) => string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      className,
      value,
      min = 0,
      max = 100,
      step = 1,
      onChange,
      accentColor = "#0071E3",
      label,
      showValue = false,
      valueFormatter = (v) => `${v}`,
      disabled,
      ...props
    },
    ref
  ) => {
    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

    return (
      <div className={cn("w-full flex flex-col gap-1.5 select-none", className)}>
        {(label || showValue) && (
          <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 font-medium px-0.5">
            {label && <span>{label}</span>}
            {showValue && <span className="font-mono">{valueFormatter(value)}</span>}
          </div>
        )}
        <div className="relative flex items-center h-5">
          <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-75"
              style={{
                width: `${percentage}%`,
                backgroundColor: accentColor,
              }}
            />
          </div>
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            {...props}
          />
          <div
            className="absolute w-3.5 h-3.5 bg-white rounded-full shadow-md border border-neutral-200 dark:border-neutral-700 pointer-events-none transition-transform duration-75"
            style={{
              left: `calc(${percentage}% - 7px)`,
            }}
          />
        </div>
      </div>
    );
  }
);

Slider.displayName = "Slider";
