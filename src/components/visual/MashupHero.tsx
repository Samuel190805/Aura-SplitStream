"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Layers, Zap, Flame, RefreshCw } from "lucide-react";

export const MashupHero: React.FC = () => {
  const [blendProgress, setBlendProgress] = useState(0.85);

  const trackA = { title: "Vocals (Track A)", key: "8A (A Minor)", bpm: 124, color: "#6366F1" };
  const trackB = { title: "Instrumental (Track B)", key: "8B (C Major)", bpm: 126, color: "#F43F5E" };

  return (
    <div className="w-full flex flex-col items-center py-6">
      <div className="w-full max-w-2xl p-6 rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-[#161618]/70 border border-neutral-200/80 dark:border-white/10 shadow-apple dark:shadow-apple-dark">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Harmonic Collision & Sync Matrix
            </span>
          </div>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
            96% Camelot Match (8A ↔ 8B)
          </span>
        </div>

        {/* Dual Track Collision Graphic */}
        <div className="flex flex-col gap-3 relative min-h-[140px] justify-center">
          {/* Track A Waveform */}
          <div className="flex items-center gap-3">
            <div className="w-24 text-[11px] font-semibold text-neutral-500 truncate">
              Track A Lead
            </div>
            <div className="flex-1 flex items-center gap-1 h-7 px-2 rounded-xl bg-neutral-100/60 dark:bg-black/40 border border-neutral-200/40 dark:border-white/5 overflow-hidden">
              {[20, 60, 80, 40, 90, 70, 30, 85, 95, 50, 40, 75, 60, 30, 80].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [`${h * 0.3}%`, `${h}%`, `${h * 0.5}%`] }}
                  transition={{ repeat: Infinity, duration: 1.1 + (i % 3) * 0.2, repeatType: "reverse" }}
                  className="flex-1 rounded-full bg-[#6366F1]"
                  style={{ opacity: 0.9, minHeight: "4px" }}
                />
              ))}
            </div>
          </div>

          {/* Collision Center Blend Indicator */}
          <div className="flex items-center justify-center -my-1 z-10">
            <div className="px-3 py-1 rounded-full bg-apple-blue text-white text-[10px] font-bold uppercase tracking-wider shadow-lg flex items-center gap-1.5 animate-pulse">
              <Zap className="w-3 h-3 text-amber-300" /> Locked Phase • 125 BPM Sync • -14 LUFS
            </div>
          </div>

          {/* Track B Waveform */}
          <div className="flex items-center gap-3">
            <div className="w-24 text-[11px] font-semibold text-neutral-500 truncate">
              Track B Base
            </div>
            <div className="flex-1 flex items-center gap-1 h-7 px-2 rounded-xl bg-neutral-100/60 dark:bg-black/40 border border-neutral-200/40 dark:border-white/5 overflow-hidden">
              {[70, 30, 85, 95, 50, 40, 75, 60, 30, 80, 20, 60, 80, 40, 90].map((h, i) => (
                <motion.div
                  key={i}
                  animate={{ height: [`${h * 0.4}%`, `${h}%`, `${h * 0.6}%`] }}
                  transition={{ repeat: Infinity, duration: 1.3 + (i % 3) * 0.2, repeatType: "reverse" }}
                  className="flex-1 rounded-full bg-[#F43F5E]"
                  style={{ opacity: 0.9, minHeight: "4px" }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-200/60 dark:border-white/5 flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" /> Rubberband Pitch & Time Shift Engine
          </span>
          <span className="font-mono text-[11px]">Strict $\pm 4$ Semitone Protection</span>
        </div>
      </div>
    </div>
  );
};

export default MashupHero;
