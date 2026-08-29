"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Volume2, ArrowRight, Globe } from "lucide-react";

export const SpeechBubbleHero: React.FC = () => {
  const phrases = [
    {
      sourceLang: "English",
      sourceFlag: "🇺🇸",
      sourceText: "Audio separation, media downloading, and speech translation.",
      targetLang: "Spanish",
      targetFlag: "🇪🇸",
      targetText: "Separación de audio, descarga de medios y traducción de voz.",
    },
    {
      sourceLang: "English",
      sourceFlag: "🇺🇸",
      sourceText: "Translate spoken words naturally in seconds.",
      targetLang: "Japanese",
      targetFlag: "🇯🇵",
      targetText: "数秒で自然に音声を翻訳します。",
    },
    {
      sourceLang: "French",
      sourceFlag: "🇫🇷",
      sourceText: "Une expérience sonore fluide et professionnelle.",
      targetLang: "English",
      targetFlag: "🇺🇸",
      targetText: "A seamless and professional audio experience.",
    },
  ];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [phrases.length]);

  const current = phrases[index];

  return (
    <div className="w-full flex flex-col items-center py-6">
      <div className="w-full max-w-2xl p-6 rounded-3xl backdrop-blur-2xl bg-white/70 dark:bg-[#161618]/70 border border-neutral-200/80 dark:border-white/10 shadow-apple dark:shadow-apple-dark">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-apple-blue" /> Speech-to-Speech Translation Pipeline
          </span>
          <span className="text-xs font-mono text-neutral-400">
            ASR → Neural MT → Neural TTS
          </span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch relative"
          >
            {/* Source Speech Card */}
            <div className="p-4 rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{current.sourceFlag}</span>
                  <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    {current.sourceLang}
                  </span>
                </div>
                <span className="p-1 rounded-lg bg-white dark:bg-neutral-700 text-apple-blue shadow-sm">
                  <Mic className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-sm text-neutral-700 dark:text-neutral-300 font-medium italic mb-4">
                &ldquo;{current.sourceText}&rdquo;
              </p>
              <div className="flex items-center gap-1 h-3">
                {[40, 70, 90, 60, 30, 80, 50].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: [`${h * 0.3}%`, `${h}%`, `${h * 0.4}%`] }}
                    transition={{ repeat: Infinity, duration: 1 + i * 0.1 }}
                    className="w-1 bg-apple-blue rounded-full"
                  />
                ))}
              </div>
            </div>

            {/* Target Spoken Output Card */}
            <div className="p-4 rounded-2xl bg-apple-blue/5 dark:bg-apple-blue/10 border border-apple-blue/20 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">{current.targetFlag}</span>
                  <span className="text-xs font-semibold text-apple-blue dark:text-apple-blueAccent">
                    {current.targetLang}
                  </span>
                </div>
                <span className="p-1 rounded-lg bg-apple-blue text-white shadow-sm">
                  <Volume2 className="w-3.5 h-3.5" />
                </span>
              </div>
              <p className="text-sm text-neutral-900 dark:text-neutral-100 font-semibold mb-4">
                &ldquo;{current.targetText}&rdquo;
              </p>
              <div className="flex items-center justify-between text-xs text-apple-blue font-medium">
                <span>Neural Voice Synthesis</span>
                <span className="font-mono text-[11px]">24kHz High-Res</span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default SpeechBubbleHero;
