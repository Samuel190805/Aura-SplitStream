"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Download,
  Sliders,
  RotateCcw,
  PictureInPicture2,
  Sparkles,
  Layers,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { YouTubeEmbed, extractYouTubeId } from "./YouTubeEmbed";
import { formatDuration } from "@/lib/utils";

export interface VideoPlayerViewProps {
  mode: "local" | "youtube";
  src?: string; // Blob URL, object URL, or YouTube URL
  title?: string;
  className?: string;
}

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({
  mode,
  src,
  title = "Video Playback",
  className,
}) => {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const isYouTube = mode === "youtube" || (src && extractYouTubeId(src) !== null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {
      // ignore
    }
  };

  const handleSendToDownloader = () => {
    if (src) {
      router.push(`/download?url=${encodeURIComponent(src)}`);
    }
  };

  const handleSendToStems = () => {
    if (src) {
      router.push(`/stems?url=${encodeURIComponent(src)}`);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Video Viewport Container */}
      <div
        ref={containerRef}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        className="relative w-full aspect-video rounded-3xl overflow-hidden bg-black shadow-2xl border border-neutral-200/80 dark:border-white/10 group"
      >
        {isYouTube && src ? (
          <YouTubeEmbed videoIdOrUrl={src} autoPlay={false} />
        ) : (
          <>
            <video
              ref={videoRef}
              src={src}
              onClick={togglePlay}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  setCurrentTime(videoRef.current.currentTime);
                  if (videoRef.current.duration && !isNaN(videoRef.current.duration)) {
                    setDuration(videoRef.current.duration);
                  }
                }
              }}
              onEnded={() => setIsPlaying(false)}
              className="w-full h-full object-contain cursor-pointer"
            />

            {/* Overlay Custom Video Controls */}
            <div
              className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 ${
                showControls ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            >
              {/* Timeline scrubber */}
              <div className="mb-2">
                <Slider
                  value={currentTime}
                  min={0}
                  max={duration || 100}
                  onChange={handleSeek}
                  accentColor="#0071E3"
                />
              </div>

              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlay}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={() => {
                      if (videoRef.current) {
                        const next = !isMuted;
                        setIsMuted(next);
                        videoRef.current.muted = next;
                      }
                    }}
                    className="p-2 rounded-full hover:bg-white/20 transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-5 h-5 text-red-400" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </button>

                  <div className="w-20 hidden sm:block">
                    <Slider
                      value={isMuted ? 0 : volume * 100}
                      min={0}
                      max={100}
                      onChange={(v) => {
                        const val = v / 100;
                        setVolume(val);
                        if (videoRef.current) videoRef.current.volume = val;
                        if (isMuted) setIsMuted(false);
                      }}
                      accentColor="#FFFFFF"
                    />
                  </div>

                  <span className="text-xs font-mono opacity-80">
                    {formatDuration(currentTime)} / {formatDuration(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Speed Selector */}
                  <select
                    value={playbackSpeed}
                    onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                    className="bg-white/20 text-white rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none cursor-pointer"
                  >
                    <option value={0.5} className="text-black">0.5x</option>
                    <option value={0.75} className="text-black">0.75x</option>
                    <option value={1.0} className="text-black">1.0x</option>
                    <option value={1.25} className="text-black">1.25x</option>
                    <option value={1.5} className="text-black">1.5x</option>
                    <option value={2.0} className="text-black">2.0x</option>
                  </select>

                  <button
                    onClick={togglePiP}
                    title="Picture in Picture"
                    className="p-2 rounded-full hover:bg-white/20 transition-colors"
                  >
                    <PictureInPicture2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={toggleFullscreen}
                    title="Fullscreen"
                    className="p-2 rounded-full hover:bg-white/20 transition-colors"
                  >
                    {isFullscreen ? (
                      <Minimize className="w-4 h-4" />
                    ) : (
                      <Maximize className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Quick Action Pills: Send to Downloader & Send to Stem Separator */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-xl border border-neutral-200/80 dark:border-white/10 shadow-sm">
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100 truncate">
            {title}
          </h4>
          <p className="text-xs text-neutral-400">
            {isYouTube ? "YouTube Stream Source" : "Local-first Video Storage"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="glass"
            size="sm"
            onClick={handleSendToDownloader}
            className="text-xs flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-apple-blue" /> Send to Downloader
          </Button>
          <Button
            variant="glass"
            size="sm"
            onClick={handleSendToStems}
            className="text-xs flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5 text-indigo-500" /> Send to Stem Separator
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerView;
