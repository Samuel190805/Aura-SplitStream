"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Music2, Activity, Play } from "lucide-react";

export const ChordHero: React.FC = () => {
  const chords = [
    { name: "Cmaj7", key: "8B", notes: ["C", "E", "G", "B"], color: "#0071E3", fret: [0, 3, 2, 0, 0, 0] },
    { name: "Am7", key: "8A", notes: ["A", "C", "E", "G"], color: "#6366F1", fret: [0, 0, 2, 0, 1, 0] },
    { name: "Dm9", key: "7A", notes: ["D", "F", "A", "C", "E"], color: "#10B981", fret: [0, 0, 0, 2, 1, 0] },
    { name: "G7sus4", key: "9B", notes: ["G", "C", "D", "F"], color: "#F59E0B", fret: [3, 2, 0, 0, 1, 1] },
  ];

  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % chords.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [chords.length]);

  const activeChord = chords[currentIndex];

  return (
    <div className="w-full flex flex-col items-center py-6">
      <div className="w-full max-w-2xl p-6 rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-[#161618]/70 border border-neutral-200/80 dark:border-white/10 shadow-apple dark:shadow-apple-dark">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Harmonic Chroma Spectrum Engine
            </span>
          </div>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold">
            Stem-Isolated Bass & Harmony
          </span>
        </div>

        {/* Live Chord Timeline & Visualizer */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          {/* Active Big Chord Display */}
          <div className="sm:col-span-1 p-5 rounded-2xl bg-neutral-100/80 dark:bg-white/5 border border-neutral-200/60 dark:border-white/5 text-center flex flex-col items-center justify-center">
            <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">
              Detected Chord
            </span>
            <AnimatePresence mode="wait">
              <motion.div
                key={activeChord.name}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.25 }}
                className="text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white my-1"
                style={{ color: activeChord.color }}
              >
                {activeChord.name}
              </motion.div>
            </AnimatePresence>
            <span className="text-[11px] font-mono text-neutral-400">
              Camelot: {activeChord.key}
            </span>
          </div>

          {/* Scrolling Measure Ribbon & Fret Dots */}
          <div className="sm:col-span-2 flex flex-col gap-3 p-4 rounded-2xl bg-neutral-100/60 dark:bg-black/40 border border-neutral-200/50 dark:border-white/5">
            <div className="flex items-center justify-between text-xs text-neutral-400">
              <span className="font-mono">Measure Progression</span>
              <span className="flex items-center gap-1 text-[11px]">
                <Activity className="w-3 h-3 text-amber-500" /> 120 BPM • 4/4
              </span>
            </div>

            {/* Chord Timeline blocks */}
            <div className="grid grid-cols-4 gap-2">
              {chords.map((c, i) => {
                const isActive = i === currentIndex;
                return (
                  <div
                    key={c.name}
                    className={`py-2 px-1 rounded-xl text-center transition-all duration-300 border ${
                      isActive
                        ? "bg-apple-blue text-white font-bold border-apple-blue shadow-md scale-105"
                        : "bg-white/50 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border-neutral-200/60 dark:border-white/5"
                    }`}
                  >
                    <div className="text-xs">{c.name}</div>
                    <div className="text-[9px] font-mono opacity-80">Bar {i + 1}</div>
                  </div>
                );
              })}
            </div>

            {/* Pitch frequency notes */}
            <div className="flex items-center justify-between text-[11px] font-mono pt-1 text-neutral-400 border-t border-neutral-200/40 dark:border-white/5">
              <span>Voicing:</span>
              <div className="flex gap-1.5">
                {activeChord.notes.map((n) => (
                  <span
                    key={n}
                    className="px-1.5 py-0.5 rounded bg-neutral-200/80 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 font-semibold"
                  >
                    {n}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-neutral-200/60 dark:border-white/5 flex items-center justify-between text-xs text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Librosa Harmonic Constant-Q & Web Audio API
          </span>
          <span className="font-mono text-[11px]">Guitar • Piano • Ukulele</span>
        </div>
      </div>
    </div>
  );
};

export default ChordHero;
