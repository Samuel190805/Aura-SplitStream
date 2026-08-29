"use client";

import React, { useEffect } from "react";
import { AlertCircle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[SplitStream Critical Error Boundary]:", error);
  }, [error]);

  return (
    <div className="min-h-[75vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-24 h-24 rounded-3xl bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-500 backdrop-blur-2xl shadow-apple mb-6">
        <AlertCircle className="w-12 h-12 stroke-[1.5]" />
      </div>

      <span className="text-xs font-mono font-semibold tracking-widest text-red-500 uppercase mb-2">
        Execution Exception • 500
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight mb-3">
        Audio DSP Pipeline Interrupted
      </h1>

      <p className="text-sm text-neutral-500 dark:text-neutral-400 max-w-md mb-8">
        {error.message || "An unexpected error occurred during execution. Intermediate files have been safely isolated."}
      </p>

      <div className="flex items-center gap-3">
        <Button variant="primary" onClick={() => reset()} className="flex items-center gap-2 shadow-apple">
          <RotateCcw className="w-4 h-4" /> Try Again
        </Button>
        <Link href="/">
          <Button variant="glass" className="flex items-center gap-2">
            <Home className="w-4 h-4" /> Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
