"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sliders,
  Download,
  Languages,
  Music,
  Video,
  Sparkles,
  Layers,
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const GlassNav: React.FC = () => {
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/stems", label: "Stems", icon: Sliders, badge: "6-Stem" },
    { href: "/download", label: "Download", icon: Download },
    { href: "/translate", label: "Translate", icon: Languages, badge: "Voice" },
    { href: "/player", label: "Studio Player", icon: Music, badge: "EQ" },
    { href: "/chords", label: "Chords", icon: Sparkles, badge: "Live" },
    { href: "/mashup", label: "Mashup", icon: Layers, badge: "Remix" },
    { href: "/status", label: "Status", icon: null },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        isScrolled
          ? "backdrop-blur-2xl bg-white/80 dark:bg-black/80 border-b border-neutral-200/80 dark:border-white/10 shadow-sm"
          : "backdrop-blur-md bg-white/40 dark:bg-black/40 border-b border-transparent"
      )}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 font-bold tracking-tight text-neutral-900 dark:text-white transition-opacity hover:opacity-80"
        >
          <div className="w-8 h-8 rounded-xl bg-apple-blue flex items-center justify-center text-white shadow-sm shadow-apple-blue/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="text-base tracking-tight font-semibold">
            SplitStream
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1.5 select-none",
                  isActive
                    ? "text-neutral-900 dark:text-white bg-neutral-200/70 dark:bg-neutral-800/80 shadow-sm font-semibold"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/40"
                )}
              >
                {link.icon && <link.icon className="w-3.5 h-3.5 opacity-70" />}
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-apple-blue/15 text-apple-blue">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Mobile Hamburger Toggle */}
        <div className="md:hidden flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-neutral-200 dark:border-white/10 bg-white/95 dark:bg-black/95 backdrop-blur-2xl px-4 py-3 space-y-1 animate-in slide-in-from-top-3">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center justify-between px-4 py-2.5 rounded-2xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-apple-blue text-white font-semibold"
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                )}
              >
                <div className="flex items-center gap-3">
                  {link.icon && <link.icon className="w-4 h-4" />}
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-current">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
};

export default GlassNav;
