"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link2, ArrowDownCircle, CheckCircle2, Music, Video, Zap } from "lucide-react";

export const LinkMorphHero: React.FC = () => {
  const [phase, setPhase] = useState<"input" | "resolving" | "ready">("input");

  useEffect(() => {
    const timer1 = setTimeout(() => setPhase("resolving"), 2500);
    const timer2 = setTimeout(() => setPhase("ready"), 5000);
    const loop = setTimeout(() => setPhase("input"), 8500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(loop);
    };
  }, [phase]);

  return (
    <div className="w-full flex flex-col items-center py-6">
      <div className="w-full max-w-xl p-6 rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-[#161618]/70 border border-neutral-200/80 dark:border-white/10 shadow-apple dark:shadow-apple-dark">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-apple-blue" /> Server-Side Stream Resolver
          </span>
          <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue font-semibold">
            {phase === "input" && "URL Input"}
            {phase === "resolving" && "Direct Stream Extraction"}
            {phase === "ready" && "Transcode Ready"}
          </span>
        </div>

        <div className="relative min-h-[90px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {phase === "input" && (
              <motion.div
                key="input"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-white/10"
              >
                <Link2 className="w-5 h-5 text-neutral-400 shrink-0" />
                <span className="text-sm font-mono text-neutral-700 dark:text-neutral-300 truncate">
                  https://www.youtube.com/watch?v=dQw4w9WgXcQ
                </span>
                <span className="ml-auto w-2 h-2 rounded-full bg-apple-blue animate-ping shrink-0" />
              </motion.div>
            )}

            {phase === "resolving" && (
              <motion.div
                key="resolving"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-apple-blue/5 dark:bg-apple-blue/10 border border-apple-blue/20"
              >
                <div className="flex items-center gap-3">
                  <ArrowDownCircle className="w-6 h-6 text-apple-blue animate-bounce" />
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      Extracting Audio & Video Streams
                    </p>
                    <p className="text-xs text-neutral-500 font-mono">
                      Resolving remote codecs: Opus 160kbps • AVC1 1080p
                    </p>
                  </div>
                </div>
                <div className="w-5 h-5 rounded-full border-2 border-apple-blue border-t-transparent animate-spin" />
              </motion.div>
            )}

            {phase === "ready" && (
              <motion.div
                key="ready"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 shadow-sm text-neutral-800 dark:text-neutral-200">
                      <Music className="w-3.5 h-3.5 text-indigo-500" /> MP3 320kbps
                    </span>
                    <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-white dark:bg-neutral-800 shadow-sm text-neutral-800 dark:text-neutral-200">
                      <Video className="w-3.5 h-3.5 text-blue-500" /> MP4 1080p
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Ready to Transcode
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default LinkMorphHero;
