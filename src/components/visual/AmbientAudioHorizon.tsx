"use client";

import React from "react";
import { useGlobalAudio } from "@/components/audio/GlobalAudioPlayer";

export const AmbientAudioHorizon: React.FC = () => {
  const { isPlaying } = useGlobalAudio();

  return (
    <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden select-none">
      {/* Top Ambient Studio Horizon */}
      <div
        className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[350px] rounded-full transition-all duration-1000 blur-[130px] ${
          isPlaying
            ? "bg-apple-blue/20 dark:bg-apple-blue/15 scale-110"
            : "bg-apple-blue/10 dark:bg-apple-blue/[0.07] scale-100"
        }`}
      />

      {/* Harmonic Horizon Light Grid Lines (Signature Studio Motif) */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />

      {/* Bottom Sub-bass Glow */}
      <div
        className={`absolute -bottom-40 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-full transition-all duration-1000 blur-[140px] ${
          isPlaying
            ? "bg-indigo-500/15 dark:bg-indigo-500/10 scale-105"
            : "bg-indigo-500/5 dark:bg-indigo-500/[0.03] scale-100"
        }`}
      />
    </div>
  );
};

export default AmbientAudioHorizon;
