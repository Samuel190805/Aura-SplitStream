"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { extractCanonicalYouTubeId } from "@/domain/value-objects/SourceUrlValidator";

export interface YouTubeEmbedProps {
  videoIdOrUrl: string;
  autoPlay?: boolean;
  className?: string;
}

export function extractYouTubeId(urlOrId: string): string | null {
  return extractCanonicalYouTubeId(urlOrId);
}

export const YouTubeEmbed: React.FC<YouTubeEmbedProps> = ({
  videoIdOrUrl,
  autoPlay = false,
  className,
}) => {
  const videoId = extractYouTubeId(videoIdOrUrl);

  if (!videoId) {
    return (
      <div className="w-full aspect-video rounded-3xl bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-400 text-sm">
        Invalid or unsupported YouTube URL
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black border border-neutral-200/80 dark:border-white/10",
        className
      )}
    >
      <iframe
        src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoPlay ? 1 : 0}&rel=0&modestbranding=1`}
        title="YouTube video player"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 w-full h-full border-0"
      />
    </div>
  );
};

export default YouTubeEmbed;
