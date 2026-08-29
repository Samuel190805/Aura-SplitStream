"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Layers, Sliders } from "lucide-react";

export const StemWaveSplittingHero: React.FC = () => {
  const [isSplit, setIsSplit] = useState(true);

  const stems = [
    { name: "Vocals", color: "#6366F1", height: [12, 38, 55, 24, 60, 42, 18, 50, 68, 30] },
    { name: "Drums", color: "#F43F5E", height: [50, 20, 65, 15, 70, 25, 60, 10, 75, 20] },
    { name: "Bass", color: "#10B981", height: [60, 50, 45, 60, 55, 65, 50, 55, 48, 52] },
    { name: "Other", color: "#F59E0B", height: [20, 35, 40, 50, 30, 45, 35, 40, 50, 30] },
  ];

  return (
    <div className="w-full flex flex-col items-center py-6">
      <div className="w-full max-w-2xl p-6 rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-[#161618]/70 border border-neutral-200/80 dark:border-white/10 shadow-apple dark:shadow-apple-dark">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-apple-blue animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              AI Deep De-mixing Preview
            </span>
          </div>
          <button
            onClick={() => setIsSplit(!isSplit)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
          >
            {isSplit ? (
              <>
                <Layers className="w-3.5 h-3.5" /> Collapse to Mix
              </>
            ) : (
              <>
                <Sliders className="w-3.5 h-3.5 text-apple-blue" /> Split Stems
              </>
            )}
          </button>
        </div>

        {/* Dynamic Waveform Container */}
        <div className="relative min-h-[140px] flex flex-col justify-center gap-3">
          {stems.map((stem, idx) => (
            <motion.div
              key={stem.name}
              initial={false}
              animate={{
                opacity: 1,
                y: isSplit ? 0 : idx * -6,
                scaleY: isSplit ? 1 : 0.8,
              }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-3"
            >
              <div className="w-16 flex items-center justify-between text-[11px] font-semibold text-neutral-500">
                <span>{stem.name}</span>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: stem.color }}
                />
              </div>

              <div className="flex-1 flex items-center gap-1 h-6 px-2 rounded-xl bg-neutral-100/50 dark:bg-neutral-900/50 border border-neutral-200/40 dark:border-white/5 overflow-hidden">
                {stem.height.map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{
                      height: isSplit ? [`${h * 0.4}%`, `${h}%`, `${h * 0.6}%`] : "40%",
                    }}
                    transition={{
                      repeat: Infinity,
                      repeatType: "reverse",
                      duration: 1.2 + (i % 4) * 0.2,
                      ease: "easeInOut",
                    }}
                    className="flex-1 rounded-full transition-all"
                    style={{
                      backgroundColor: isSplit ? stem.color : "#9CA3AF",
                      opacity: isSplit ? 0.9 : 0.4,
                      minHeight: "4px",
                    }}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-200/60 dark:border-white/5 flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Meta AI Demucs v4 Engine
          </span>
          <span className="font-mono text-[11px]">44.1kHz • 32-bit Float</span>
        </div>
      </div>
    </div>
  );
};

export default StemWaveSplittingHero;
