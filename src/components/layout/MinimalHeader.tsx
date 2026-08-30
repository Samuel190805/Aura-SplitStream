"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles, Menu } from "lucide-react";
import { FullscreenOverlayNav } from "./FullscreenOverlayNav";
import { MagneticWrapper } from "@/components/cursor/MagneticWrapper";

export const MinimalHeader: React.FC = () => {
  const pathname = usePathname();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "backdrop-blur-xl bg-black/60 border-b border-white/5 py-3"
            : "bg-transparent py-5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between">
          {/* Minimal Fixed Mark (Top-Left) */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group select-none cursor-pointer"
            aria-label="SplitStream Home"
          >
            <div className="w-7 h-7 rounded-xl bg-apple-blue flex items-center justify-center text-white shadow-lg shadow-apple-blue/30 group-hover:scale-105 transition-transform">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-tighter text-white">
                SPLITSTREAM
              </span>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-apple-blue animate-pulse" />
            </div>
          </Link>

          {/* Minimal Menu Trigger (Top-Right) */}
          <div className="flex items-center gap-4">
            <MagneticWrapper strength={0.25}>
              <button
                onClick={() => setOverlayOpen(true)}
                className="group flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-md transition-all shadow-sm active:scale-95"
                aria-label="Open Navigation Menu"
              >
                <span className="font-mono text-[11px] text-neutral-300 group-hover:text-white transition-colors">
                  MENU
                </span>
                <div className="w-4 h-4 flex flex-col justify-center gap-1">
                  <span className="w-4 h-0.5 bg-white rounded-full group-hover:w-3 transition-all" />
                  <span className="w-2.5 h-0.5 bg-apple-blue rounded-full group-hover:w-4 transition-all" />
                </div>
              </button>
            </MagneticWrapper>
          </div>
        </div>
      </header>

      {/* Fullscreen Overlay Menu */}
      <FullscreenOverlayNav
        isOpen={overlayOpen}
        onClose={() => setOverlayOpen(false)}
      />
    </>
  );
};

export default MinimalHeader;
