"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Compass, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-apple-blue/10 dark:bg-apple-blue/20 border border-apple-blue/30 flex items-center justify-center text-apple-blue backdrop-blur-2xl shadow-apple">
          <Compass className="w-12 h-12 stroke-[1.5] animate-pulse" />
        </div>
      </div>

      <span className="text-xs font-mono font-semibold tracking-widest text-apple-blue uppercase mb-2">
        Error 404 • Page Not Found
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight mb-3">
        Lost in Frequency
      </h1>

      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mb-8">
        The track, stem, or route you are looking for has been moved, removed, or never existed in the audio matrix.
      </p>

      <div className="flex items-center gap-3">
        <Link href="/">
          <Button variant="primary" className="flex items-center gap-2 shadow-apple">
            <Home className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
        <Link href="/stems">
          <Button variant="glass" className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Go to Stem Studio
          </Button>
        </Link>
      </div>
    </div>
  );
}
