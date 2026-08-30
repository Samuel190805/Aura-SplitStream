"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowDown, Sparkles } from "lucide-react";
import { MagneticWrapper } from "@/components/cursor/MagneticWrapper";

export interface ModeAHeroStat {
  label: string;
  value: string;
  sublabel?: string;
}

export interface ModeAHeroProps {
  chapterNumber: string;
  badge?: string;
  headline: string;
  subheadline: string;
  description: string;
  stats?: ModeAHeroStat[];
  visualComponent: React.ReactNode;
  toolAnchorId: string;
  toolCtaText?: string;
  align?: "left" | "right";
  condensed?: boolean;
}

export const ModeAHero: React.FC<ModeAHeroProps> = ({
  chapterNumber,
  badge,
  headline,
  subheadline,
  description,
  stats = [],
  visualComponent,
  toolAnchorId,
  toolCtaText = "Enter Studio Workspace",
  align = "left",
  condensed = false,
}) => {
  const scrollToTool = () => {
    const el = document.getElementById(toolAnchorId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      className={`w-full relative flex flex-col justify-center ${
        condensed ? "min-h-[60vh] pt-24 pb-12" : "min-h-[85vh] pt-28 pb-16"
      }`}
    >
      {/* Background Soft Radial Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-apple-blue/10 blur-[130px] rounded-full pointer-events-none -z-10" />

      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 flex flex-col gap-10">
        {/* Chapter Index + Badge Header */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs sm:text-sm font-bold tracking-widest text-apple-blue">
            {chapterNumber}
          </span>
          <span className="w-6 h-[1px] bg-white/20" />
          {badge && (
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/10">
              <Sparkles className="w-3 h-3 text-apple-blue" />
              {badge}
            </span>
          )}
        </div>

        {/* Asymmetric Editorial Grid */}
        <div
          className={`grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center ${
            align === "right" ? "lg:grid-flow-dense" : ""
          }`}
        >
          {/* Left / Primary Text Column */}
          <div
            className={`lg:col-span-7 flex flex-col gap-6 ${
              align === "right" ? "lg:col-start-6" : "lg:col-start-1"
            }`}
          >
            {/* Oversized Breaking Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter text-white leading-[0.92] text-balance"
            >
              {headline}
            </motion.h1>

            {/* Subheadline & Story Description */}
            <div className="flex flex-col gap-3 max-w-xl">
              <p className="text-base sm:text-lg font-semibold text-apple-blueAccent">
                {subheadline}
              </p>
              <p className="text-sm sm:text-base text-neutral-400 font-normal leading-relaxed">
                {description}
              </p>
            </div>

            {/* Oversized Stats Strip */}
            {stats.length > 0 && (
              <div className="flex flex-wrap items-center gap-6 sm:gap-8 pt-4 border-t border-white/10">
                {stats.map((st, i) => (
                  <div key={i} className="flex flex-col">
                    <span className="text-2xl sm:text-3xl font-black text-white tracking-tight font-mono">
                      {st.value}
                    </span>
                    <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
                      {st.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Intentional "Seam" Trigger Button */}
            <div className="pt-2">
              <MagneticWrapper strength={0.3}>
                <button
                  onClick={scrollToTool}
                  className="group inline-flex items-center gap-3 px-6 py-3 rounded-full bg-apple-blue hover:bg-apple-blueHover text-white text-xs sm:text-sm font-bold tracking-tight shadow-apple transition-all active:scale-95"
                >
                  <span>{toolCtaText}</span>
                  <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-y-0.5 transition-transform">
                    <ArrowDown className="w-3 h-3" />
                  </div>
                </button>
              </MagneticWrapper>
            </div>
          </div>

          {/* Right / Visual Column */}
          <div
            className={`lg:col-span-5 flex items-center justify-center ${
              align === "right" ? "lg:col-start-1" : ""
            }`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {visualComponent}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ModeAHero;
