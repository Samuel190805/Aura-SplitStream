"use client";

import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export interface VUMeterProps {
  isPlaying: boolean;
  volume?: number; // 0 to 1
  isMuted?: boolean;
  bars?: number;
  className?: string;
}

export const VUMeter: React.FC<VUMeterProps> = ({
  isPlaying,
  volume = 1,
  isMuted = false,
  bars = 8,
  className,
}) => {
  const [levels, setLevels] = useState<number[]>(Array(bars).fill(0));

  useEffect(() => {
    if (!isPlaying || isMuted || volume === 0) {
      setLevels(Array(bars).fill(0));
      return;
    }

    const interval = setInterval(() => {
      const activeCount = Math.round(
        Math.min(bars, Math.max(1, (Math.random() * 0.6 + 0.4) * volume * bars))
      );
      setLevels(
        Array(bars)
          .fill(0)
          .map((_, i) => (i < activeCount ? 1 : 0))
      );
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, isMuted, volume, bars]);

  return (
    <div className={cn("flex items-center gap-0.5 h-3.5", className)}>
      {levels.map((lvl, idx) => {
        const isHigh = idx >= bars - 2;
        const isMid = idx >= bars - 4 && idx < bars - 2;
        const color = isHigh
          ? "bg-red-500"
          : isMid
          ? "bg-amber-400"
          : "bg-emerald-500";

        return (
          <div
            key={idx}
            className={cn(
              "w-1 h-full rounded-sm transition-all duration-75",
              lvl === 1 ? color : "bg-neutral-200 dark:bg-neutral-800"
            )}
          />
        );
      })}
    </div>
  );
};

export default VUMeter;
