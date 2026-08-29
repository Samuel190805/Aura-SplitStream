"use client";

import React, { useRef, useEffect } from "react";
import { ChordEvent, transposeChord, simplifyChord } from "@/domain/value-objects/ChordData";
import { Clock } from "lucide-react";

export interface ChordChartProps {
  chords: ChordEvent[];
  currentTime: number;
  duration: number;
  transposeSemis: number;
  isSimplified: boolean;
  loopStart: number | null;
  loopEnd: number | null;
  onSeek: (time: number) => void;
  className?: string;
}

export const ChordChart: React.FC<ChordChartProps> = ({
  chords,
  currentTime,
  duration,
  transposeSemis,
  isSimplified,
  loopStart,
  loopEnd,
  onSeek,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const activeChordRef = useRef<HTMLDivElement | null>(null);

  // Active chord calculation
  const activeIndex = chords.findIndex((c, i) => {
    const nextTime = chords[i + 1]?.timestamp ?? duration;
    return currentTime >= c.timestamp && currentTime < nextTime;
  });

  useEffect(() => {
    if (activeChordRef.current && containerRef.current) {
      activeChordRef.current.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
    }
  }, [activeIndex]);

  return (
    <div className={`p-4 rounded-2xl bg-white/70 dark:bg-[#161618]/70 border border-neutral-200/80 dark:border-white/10 backdrop-blur-xl ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200/60 dark:border-white/10 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-apple-blue animate-pulse" />
          <h4 className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">
            Harmonic Progression Chart ({chords.length} Bars)
          </h4>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
          <Clock className="w-3 h-3" />
          <span>Click any chord measure to jump playback</span>
        </div>
      </div>

      {/* Horizontal Scrolling Timeline */}
      <div
        ref={containerRef}
        className="flex items-center gap-3 overflow-x-auto py-2 px-1 scrollbar-none snap-x"
      >
        {chords.map((chordEvent, idx) => {
          let displayChord = transposeChord(chordEvent.chord, transposeSemis);
          if (isSimplified) {
            displayChord = simplifyChord(displayChord);
          }

          const isActive = idx === activeIndex;
          const nextTime = chords[idx + 1]?.timestamp ?? duration;
          const isInLoop =
            loopStart !== null &&
            loopEnd !== null &&
            chordEvent.timestamp >= loopStart &&
            chordEvent.timestamp <= loopEnd;

          return (
            <div
              key={`chord_${chordEvent.timestamp}_${idx}`}
              ref={isActive ? activeChordRef : null}
              onClick={() => onSeek(chordEvent.timestamp)}
              className={`min-w-[90px] p-3 rounded-2xl border flex flex-col items-center justify-center cursor-pointer transition-all duration-200 snap-center shrink-0 select-none ${
                isActive
                  ? "bg-apple-blue text-white border-apple-blue shadow-lg scale-105"
                  : isInLoop
                  ? "bg-amber-500/10 border-amber-500/30 text-neutral-800 dark:text-neutral-200"
                  : "bg-neutral-100/70 dark:bg-white/5 border-neutral-200/60 dark:border-white/5 text-neutral-700 dark:text-neutral-300 hover:border-apple-blue/40"
              }`}
            >
              <span className="text-[10px] font-mono opacity-60 mb-0.5">
                Bar {idx + 1}
              </span>
              <span className={`text-lg font-extrabold ${isActive ? "text-white" : "text-apple-blue dark:text-white"}`}>
                {displayChord}
              </span>
              <span className="text-[9px] font-mono opacity-50 mt-1">
                {Math.floor(chordEvent.timestamp / 60)}:
                {Math.floor(chordEvent.timestamp % 60).toString().padStart(2, "0")}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChordChart;
