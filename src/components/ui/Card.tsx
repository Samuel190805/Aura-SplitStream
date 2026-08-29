"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "solid" | "subtle" | "glow";
  hoverEffect?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "glass",
      hoverEffect = false,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      glass:
        "backdrop-blur-2xl bg-white/80 dark:bg-[#161618]/75 border border-neutral-200/80 dark:border-white/[0.08] shadow-apple dark:shadow-apple-dark",
      solid:
        "bg-white dark:bg-[#1C1C1E] border border-neutral-200 dark:border-neutral-800 shadow-sm",
      subtle:
        "bg-neutral-50/80 dark:bg-[#121214]/60 border border-neutral-200/50 dark:border-white/[0.05]",
      glow:
        "backdrop-blur-2xl bg-white/90 dark:bg-[#161618]/90 border border-apple-blue/30 shadow-glow",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-3xl p-6 transition-all duration-300",
          variants[variant],
          hoverEffect && "hover:-translate-y-1 hover:shadow-xl hover:border-neutral-300 dark:hover:border-white/20",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";
