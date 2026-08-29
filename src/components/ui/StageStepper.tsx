"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Check, Loader2 } from "lucide-react";

export interface StageStep {
  id: string;
  label: string;
  description?: string;
}

export interface StageStepperProps {
  stages: StageStep[];
  currentStageId: string;
  isCompleted?: boolean;
  isFailed?: boolean;
  className?: string;
}

export const StageStepper: React.FC<StageStepperProps> = ({
  stages,
  currentStageId,
  isCompleted = false,
  isFailed = false,
  className,
}) => {
  const currentIndex = stages.findIndex(
    (s) => s.id.toUpperCase() === currentStageId.toUpperCase()
  );

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative flex items-center justify-between">
        {/* Horizontal connecting background track */}
        <div className="absolute left-6 right-6 top-4 h-0.5 bg-neutral-200 dark:bg-neutral-800 -z-0" />

        {stages.map((stage, idx) => {
          const isPassed = isCompleted || (currentIndex > idx && !isFailed);
          const isCurrent = !isCompleted && currentIndex === idx && !isFailed;
          const isStepFailed = isFailed && currentIndex === idx;

          return (
            <div
              key={stage.id}
              className="flex flex-col items-center relative z-10 group"
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-300 shadow-sm",
                  isPassed &&
                    "bg-emerald-500 text-white shadow-emerald-500/20 ring-4 ring-emerald-500/10",
                  isCurrent &&
                    "bg-apple-blue text-white shadow-apple-blue/30 ring-4 ring-apple-blue/20 animate-pulse-subtle",
                  isStepFailed &&
                    "bg-red-500 text-white shadow-red-500/30 ring-4 ring-red-500/20",
                  !isPassed &&
                    !isCurrent &&
                    !isStepFailed &&
                    "bg-neutral-100 dark:bg-neutral-800 text-neutral-400 border border-neutral-300 dark:border-neutral-700"
                )}
              >
                {isPassed ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin stroke-[2.5]" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              <div className="mt-2.5 text-center">
                <p
                  className={cn(
                    "text-xs font-medium tracking-tight transition-colors",
                    isCurrent
                      ? "text-apple-blue dark:text-apple-blueAccent font-semibold"
                      : isPassed
                      ? "text-neutral-900 dark:text-neutral-100"
                      : "text-neutral-400 dark:text-neutral-500"
                  )}
                >
                  {stage.label}
                </p>
                {stage.description && (
                  <p className="text-[10px] text-neutral-400 dark:text-neutral-500 max-w-[100px] hidden sm:block">
                    {stage.description}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StageStepper;
