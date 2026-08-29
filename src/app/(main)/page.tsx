"use client";

import React from "react";
import Link from "next/link";
import {
  Sliders,
  Download,
  Languages,
  Music,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Layers,
  Cpu,
  Flame,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StemWaveSplittingHero } from "@/components/visual/StemWaveSplittingHero";

export default function HomePage() {
  const features = [
    {
      id: "stems",
      title: "Stem Separator",
      headline: "6-Stem Isolation & Ensemble Neural De-mixing",
      description:
        "Isolate Vocals, Drums, Bass, Piano, and Guitar with Meta Demucs v4 and post-separation spectral denoising.",
      href: "/stems",
      icon: Sliders,
      badge: "6-Stem Ensemble",
      accent: "text-indigo-500",
      cta: "Separate Stems",
    },
    {
      id: "download",
      title: "Universal Downloader",
      headline: "Lossless FLAC, Auto-Tagging & -14 LUFS Mastering",
      description:
        "Acoustic fingerprint metadata auto-tagging, -14 LUFS loudness normalization, and verified FLAC/MP3 extraction.",
      href: "/download",
      icon: Download,
      badge: "Lossless FLAC",
      accent: "text-blue-500",
      cta: "Download Media",
    },
    {
      id: "translate",
      title: "Translate & Speak",
      headline: "Voice-Preserving Speech & Multi-Speaker Diarization",
      description:
        "Preserve speaker pitch, timbre, and emotion across 30+ languages with neural diarization and formant cloning.",
      href: "/translate",
      icon: Languages,
      badge: "Voice Clone",
      accent: "text-emerald-500",
      cta: "Translate Speech",
    },
    {
      id: "player",
      title: "Unified Studio Player",
      headline: "Universal Audio & Video Player with 5-Band Studio EQ",
      description:
        "Play local files and YouTube links with synced Whisper karaoke lyrics, dynamic bass boost, and quick actions.",
      href: "/player",
      icon: Music,
      badge: "Parametric EQ",
      accent: "text-amber-500",
      cta: "Open Studio Player",
    },
    {
      id: "chords",
      title: "AI Chord Detector",
      headline: "Stem-Driven Chroma Detection & Live Mic Practice",
      description:
        "Extract chord charts from isolated stems with interactive Guitar, Piano, and Ukulele diagrams and live mic detection.",
      href: "/chords",
      icon: Sparkles,
      badge: "Live Mic",
      accent: "text-amber-500",
      cta: "Detect Chords",
    },
    {
      id: "mashup",
      title: "AI Mashup Creator",
      headline: "Camelot Harmonic Mixing & Phase Beat Synchronization",
      description:
        "Blend stems from two tracks with automatic Camelot key matching, beat alignment, and -14 LUFS mastering.",
      href: "/mashup",
      icon: Layers,
      badge: "AI Remix",
      accent: "text-rose-500",
      cta: "Create Mashup",
    },
  ];

  return (
    <div className="flex flex-col items-center gap-16 py-8">
      {/* Apple-Style Main Hero */}
      <section className="text-center max-w-4xl mx-auto pt-10 pb-4 px-4 flex flex-col items-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider text-apple-blue bg-apple-blue/10 border border-apple-blue/20 mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Professional Audio & AI Media Suite</span>
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-neutral-900 dark:text-white mb-6 leading-[1.1]">
          Precision Stems. <br className="hidden sm:inline" />
          Harmonic Remixes.
        </h1>

        <p className="text-lg sm:text-xl text-neutral-500 dark:text-neutral-400 max-w-2xl font-normal leading-relaxed mb-8">
          Six studio-grade media tools built with deep learning source separation, Camelot harmonic theory, and strict storage discipline.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link href="/stems">
            <Button size="lg" className="flex items-center gap-2 shadow-apple">
              <Sliders className="w-4 h-4" /> Stem Separator
            </Button>
          </Link>
          <Link href="/mashup">
            <Button variant="glass" size="lg" className="flex items-center gap-2">
              <Layers className="w-4 h-4" /> AI Mashup Studio
            </Button>
          </Link>
          <Link href="/player">
            <Button variant="glass" size="lg" className="flex items-center gap-2">
              <Music className="w-4 h-4" /> Studio Player
            </Button>
          </Link>
        </div>

        {/* Feature quick telemetry badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-xs font-semibold text-neutral-400">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-apple-blue" /> HTDemucs v4 6-Stem
          </span>
          <span className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" /> -14 LUFS Loudness
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" /> Zero Storage Bloat
          </span>
        </div>
      </section>

      {/* Interactive Visual Hero */}
      <section className="w-full max-w-5xl">
        <StemWaveSplittingHero />
      </section>

      {/* The 6 Feature Cards */}
      <section className="w-full max-w-5xl flex flex-col gap-8">
        <div className="text-center max-w-xl mx-auto mb-2">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white">
            The 6 Core Media Capabilities
          </h2>
          <p className="text-sm text-neutral-400 mt-1">
            Engineered with Clean Architecture and verified container integrity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <Card
              key={f.id}
              variant="glass"
              hoverEffect
              className="flex flex-col justify-between p-6 group shadow-apple dark:shadow-apple-dark"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-neutral-100 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10 flex items-center justify-center text-apple-blue group-hover:scale-105 transition-transform">
                    <f.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-apple-blue/10 text-apple-blue border border-apple-blue/20">
                    {f.badge}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1.5">
                  {f.title}
                </h3>
                <p className="text-xs font-semibold text-apple-blue dark:text-apple-blue mb-2">
                  {f.headline}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {f.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-200/60 dark:border-white/5 flex items-center justify-between">
                <Link href={f.href} className="w-full">
                  <Button variant="glass" size="sm" className="w-full flex items-center justify-between text-xs">
                    <span>{f.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Storage Discipline & Status Card Footer */}
      <section className="w-full max-w-5xl">
        <Card variant="glass" className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                Live Retention Discipline & Telemetry
              </h4>
              <p className="text-xs text-neutral-400">
                Automatic intermediate cleanup active • All DSP engines operational
              </p>
            </div>
          </div>

          <Link href="/status">
            <Button variant="glass" size="sm" className="text-xs flex items-center gap-1">
              View System Status <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </Card>
      </section>
    </div>
  );
}
