"use client";

import React, { useRef } from "react";
import { cn } from "@/lib/utils";

export interface WaveformVisualizerProps {
  waveformData?: number[];
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  accentColor?: string;
  height?: number;
  className?: string;
}

export const WaveformVisualizer: React.FC<WaveformVisualizerProps> = ({
  waveformData,
  currentTime,
  duration,
  onSeek,
  accentColor = "#0071E3",
  height = 40,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate default peaks if none provided
  const peaks =
    waveformData && waveformData.length > 0
      ? waveformData
      : [
          0.2, 0.4, 0.6, 0.8, 0.5, 0.3, 0.7, 0.9, 0.4, 0.6, 0.8, 0.7, 0.5, 0.3, 0.6,
          0.8, 0.9, 0.7, 0.4, 0.6, 0.5, 0.8, 0.6, 0.4, 0.7, 0.9, 0.8, 0.5, 0.3, 0.6,
          0.8, 0.7, 0.4, 0.6, 0.8, 0.5, 0.3, 0.7, 0.9, 0.4, 0.6, 0.8, 0.7, 0.5, 0.3,
        ];

  const progressFraction = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || duration <= 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const fraction = Math.min(1, Math.max(0, clickX / rect.width));
    onSeek(fraction * duration);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{ height }}
      className={cn(
        "relative w-full flex items-center gap-[2px] cursor-pointer group py-1 select-none",
        className
      )}
    >
      {peaks.map((peak, idx) => {
        const barFraction = idx / peaks.length;
        const isPlayed = barFraction <= progressFraction;

        return (
          <div
            key={idx}
            className="flex-1 rounded-full transition-all duration-75 group-hover:opacity-100"
            style={{
              height: `${Math.max(12, peak * 100)}%`,
              backgroundColor: isPlayed ? accentColor : "rgba(150, 150, 150, 0.25)",
            }}
          />
        );
      })}

      {/* Playhead line indicator */}
      <div
        className="absolute top-0 bottom-0 w-[2px] bg-white shadow-md pointer-events-none transition-all duration-75"
        style={{
          left: `${progressFraction * 100}%`,
        }}
      />
    </div>
  );
};

export default WaveformVisualizer;
