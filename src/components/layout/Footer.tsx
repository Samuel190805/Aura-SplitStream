"use client";

import React from "react";
import Link from "next/link";
import { Sparkles, ShieldCheck } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-neutral-200/80 dark:border-white/10 bg-neutral-50/50 dark:bg-black/50 backdrop-blur-md mt-20">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-apple-blue flex items-center justify-center text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">
                SplitStream
              </span>
              <p className="text-xs text-neutral-400">
                AI Source Separation & Media Transcoding Engine
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-neutral-500">
            <Link href="/stems" className="hover:text-apple-blue transition-colors">
              Stem Separator
            </Link>
            <Link href="/download" className="hover:text-apple-blue transition-colors">
              Link Downloader
            </Link>
            <Link href="/translate" className="hover:text-apple-blue transition-colors">
              Translate & Speak
            </Link>
            <Link href="/audio-player" className="hover:text-apple-blue transition-colors">
              Audio Player
            </Link>
            <Link href="/video-player" className="hover:text-apple-blue transition-colors">
              Video Player
            </Link>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Output Integrity Verified via FFprobe</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-200/40 dark:border-white/5 text-center text-xs text-neutral-400">
          <p>© {new Date().getFullYear()} SplitStream. Built with Clean Architecture & Apple Design Language.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
