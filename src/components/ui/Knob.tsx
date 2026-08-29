"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";

export interface KnobProps {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  size?: number;
  label?: string;
  unit?: string;
  accentColor?: string;
  onChange: (value: number) => void;
  className?: string;
}

export const Knob: React.FC<KnobProps> = ({
  value,
  min = -100,
  max = 100,
  size = 48,
  label,
  unit = "",
  accentColor = "#0071E3",
  onChange,
  className,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef<number>(0);
  const startValRef = useRef<number>(value);

  const percentage = Math.min(1, Math.max(0, (value - min) / (max - min)));
  // Map to 270 degree rotation arc (-135deg to +135deg)
  const rotationDeg = -135 + percentage * 270;

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValRef.current = value;
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      const dy = startYRef.current - e.clientY;
      const range = max - min;
      const deltaVal = (dy / 100) * range;
      const nextVal = Math.min(max, Math.max(min, Math.round(startValRef.current + deltaVal)));
      onChange(nextVal);
    },
    [isDragging, max, min, onChange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div className={cn("flex flex-col items-center select-none", className)}>
      <div
        onMouseDown={handleMouseDown}
        style={{ width: size, height: size }}
        className="relative rounded-full bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-300/80 dark:border-white/10 shadow-inner flex items-center justify-center cursor-ns-resize"
      >
        <div
          className="w-1.5 h-1.5 rounded-full absolute transition-transform duration-75"
          style={{
            top: 6,
            backgroundColor: accentColor,
            transform: `rotate(${rotationDeg}deg)`,
            transformOrigin: `50% ${size / 2 - 6}px`,
          }}
        />
        <div className="w-6 h-6 rounded-full bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-sm" />
      </div>
      {label && (
        <span className="mt-1 text-[10px] uppercase tracking-wider font-semibold text-neutral-400">
          {label}
        </span>
      )}
      <span className="text-[11px] font-mono text-neutral-600 dark:text-neutral-300 font-medium">
        {value > 0 ? `+${value}` : value}
        {unit}
      </span>
    </div>
  );
};

export default Knob;
