"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  Music,
  X,
} from "lucide-react";
import { Slider } from "@/components/ui/Slider";
import { formatDuration } from "@/lib/utils";

export interface AudioTrackItem {
  id: string;
  title: string;
  artist?: string;
  src: string;
  albumArt?: string;
  duration?: number;
}

interface AudioContextType {
  currentTrack: AudioTrackItem | null;
  isPlaying: boolean;
  playTrack: (track: AudioTrackItem) => void;
  togglePlay: () => void;
  pause: () => void;
  closePlayer: () => void;
}

const AudioContext = createContext<AudioContextType>({
  currentTrack: null,
  isPlaying: false,
  playTrack: () => {},
  togglePlay: () => {},
  pause: () => {},
  closePlayer: () => {},
});

export const useGlobalAudio = () => useContext(AudioContext);

export const GlobalAudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentTrack, setCurrentTrack] = useState<AudioTrackItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playTrack = (track: AudioTrackItem) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.src = track.src;
      audioRef.current.play().catch(() => {});
    }
  };

  const togglePlay = () => {
    if (!audioRef.current || !currentTrack) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const closePlayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentTrack(null);
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        isPlaying,
        playTrack,
        togglePlay,
        pause,
        closePlayer,
      }}
    >
      {children}

      <audio
        ref={audioRef}
        loop={isLooping}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
            if (audioRef.current.duration && !isNaN(audioRef.current.duration)) {
              setDuration(audioRef.current.duration);
            }
          }
        }}
        onEnded={() => {
          if (!isLooping) setIsPlaying(false);
        }}
      />

      {currentTrack && (
        <div className="fixed bottom-4 left-4 right-4 max-w-4xl mx-auto z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="rounded-3xl backdrop-blur-2xl bg-white/90 dark:bg-[#1C1C1E]/95 border border-neutral-200/80 dark:border-white/10 shadow-2xl p-3.5 flex items-center justify-between gap-4">
            {/* Track Info */}
            <div className="flex items-center gap-3 min-w-0 w-1/4">
              <div className="w-11 h-11 rounded-2xl bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue flex items-center justify-center shrink-0 shadow-sm">
                <Music className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h5 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 truncate">
                  {currentTrack.title}
                </h5>
                <p className="text-xs text-neutral-400 truncate">
                  {currentTrack.artist || "SplitStream Playback"}
                </p>
              </div>
            </div>

            {/* Controls & Progress */}
            <div className="flex-1 flex flex-col items-center max-w-md">
              <div className="flex items-center gap-3 mb-1">
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`p-1.5 rounded-full transition-colors ${
                    isLooping ? "text-apple-blue" : "text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                  }`}
                >
                  <Repeat className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSeek(Math.max(0, currentTime - 5))}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <SkipBack className="w-4 h-4" />
                </button>
                <button
                  onClick={togglePlay}
                  className="w-9 h-9 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all"
                >
                  {isPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => handleSeek(Math.min(duration, currentTime + 5))}
                  className="p-1.5 rounded-full text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              <div className="w-full flex items-center gap-2 text-[11px] font-mono text-neutral-400">
                <span>{formatDuration(currentTime)}</span>
                <div className="flex-1">
                  <Slider
                    value={currentTime}
                    min={0}
                    max={duration || 100}
                    onChange={handleSeek}
                    accentColor="#0071E3"
                  />
                </div>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            {/* Volume & Close */}
            <div className="flex items-center gap-3 justify-end w-1/4">
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => {
                    if (audioRef.current) {
                      const next = !isMuted;
                      setIsMuted(next);
                      audioRef.current.muted = next;
                    }
                  }}
                  className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <div className="w-16">
                  <Slider
                    value={isMuted ? 0 : volume * 100}
                    min={0}
                    max={100}
                    onChange={(v) => {
                      const val = v / 100;
                      setVolume(val);
                      if (audioRef.current) audioRef.current.volume = val;
                      if (isMuted) setIsMuted(false);
                    }}
                  />
                </div>
              </div>

              <button
                onClick={closePlayer}
                className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </AudioContext.Provider>
  );
};
