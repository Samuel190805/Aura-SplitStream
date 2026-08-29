"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Sliders,
  Check,
  Music,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/Slider";
import { Knob } from "@/components/ui/Knob";
import { WaveformVisualizer } from "./WaveformVisualizer";
import { VUMeter } from "./VUMeter";
import { formatDuration, formatBytes } from "@/lib/utils";

export interface StemTrack {
  id: string;
  name: string;
  kind: "STEM_VOCALS" | "STEM_DRUMS" | "STEM_BASS" | "STEM_OTHER" | "STEM_PIANO" | "STEM_GUITAR" | "STEM_INSTRUMENTAL";
  url: string;
  color?: string;
  waveformData?: number[];
  sizeBytes?: number;
  format?: string;
  confidenceScore?: number;
  clarityPercent?: number;
}

export interface StemMixerProps {
  tracks: StemTrack[];
  title?: string;
  className?: string;
}

interface TrackControlState {
  volume: number; // 0 to 1
  pan: number; // -100 to +100
  isMuted: boolean;
  isSolo: boolean;
}

export const StemMixer: React.FC<StemMixerProps> = ({
  tracks,
  title = "Stem Separation Mix",
  className,
}) => {
  // Master Synced Engine State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [masterVolume, setMasterVolume] = useState(1);
  const [isMasterMuted, setIsMasterMuted] = useState(false);

  // FIX 2: Dedicated Single-Purpose Preview Engine State (Decoupled from Master Engine)
  const [previewTrackId, setPreviewTrackId] = useState<string | null>(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Track control states keyed by track id
  const [trackStates, setTrackStates] = useState<Record<string, TrackControlState>>(() => {
    const init: Record<string, TrackControlState> = {};
    tracks.forEach((t) => {
      init[t.id] = {
        volume: 0.85,
        pan: 0,
        isMuted: false,
        isSolo: false,
      };
    });
    return init;
  });

  // Master synchronized multi-track audio elements
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  // Check if any track has Solo active
  const hasAnySolo = Object.values(trackStates).some((s) => s.isSolo);

  // Master "Play Mix" Handler
  const togglePlay = () => {
    // FIX 2 Rule: Pressing master "Play Mix" stops any active individual stem preview
    if (previewAudioRef.current && (previewTrackId || isPreviewPlaying)) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
      setPreviewTrackId(null);
    }

    if (isPlaying) {
      Object.values(audioRefs.current).forEach((audio) => audio.pause());
      setIsPlaying(false);
    } else {
      Object.values(audioRefs.current).forEach((audio) => {
        audio.currentTime = currentTime;
        audio.play().catch(() => {});
      });
      setIsPlaying(true);
    }
  };

  // FIX 2: Dedicated Individual Stem Isolated Preview Handler
  const togglePreview = (track: StemTrack) => {
    const previewEl = previewAudioRef.current;
    if (!previewEl) return;

    // If this exact track is currently playing in preview -> Pause it
    if (previewTrackId === track.id && isPreviewPlaying) {
      previewEl.pause();
      setIsPreviewPlaying(false);
      return;
    }

    // If this exact track was loaded and paused -> Resume it
    if (previewTrackId === track.id && !isPreviewPlaying) {
      // Rule: Stop master engine if playing
      if (isPlaying) {
        Object.values(audioRefs.current).forEach((a) => a.pause());
        setIsPlaying(false);
      }
      previewEl.volume = isMasterMuted ? 0 : masterVolume;
      previewEl.play().catch(() => {});
      setIsPreviewPlaying(true);
      return;
    }

    // Otherwise, start preview for this row:
    // 1. Stop master engine (if playing)
    if (isPlaying) {
      Object.values(audioRefs.current).forEach((a) => a.pause());
      setIsPlaying(false);
    }

    // 2. Stop any previous stem preview
    previewEl.pause();

    // 3. Load ONLY this stem into the dedicated preview element (ignoring Solo/Mute)
    previewEl.src = track.url;
    previewEl.currentTime = currentTime;
    previewEl.volume = isMasterMuted ? 0 : masterVolume;
    previewEl.play().catch(() => {});

    setPreviewTrackId(track.id);
    setIsPreviewPlaying(true);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
    // Update all master synced audio elements
    Object.values(audioRefs.current).forEach((audio) => {
      audio.currentTime = time;
    });
    // Update dedicated preview element
    if (previewAudioRef.current) {
      previewAudioRef.current.currentTime = time;
    }
  };

  const handleRestart = () => {
    handleSeek(0);
  };

  // Master engine time tracking
  const handleMasterTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    if (isPlaying) {
      const target = e.currentTarget;
      setCurrentTime(target.currentTime);
      if (target.duration && !isNaN(target.duration) && duration === 0) {
        setDuration(target.duration);
      }
    }
  };

  const updateTrackState = (id: string, updates: Partial<TrackControlState>) => {
    setTrackStates((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...updates },
    }));
  };

  // Apply master track gains, mutes, and solo to master audio elements
  useEffect(() => {
    tracks.forEach((track) => {
      const audio = audioRefs.current[track.id];
      const state = trackStates[track.id];
      if (!audio || !state) return;

      let effectiveVolume = state.volume * (isMasterMuted ? 0 : masterVolume);

      if (state.isMuted) {
        effectiveVolume = 0;
      } else if (hasAnySolo) {
        effectiveVolume = state.isSolo ? effectiveVolume : 0;
      }

      audio.volume = Math.min(1, Math.max(0, effectiveVolume));
    });
  }, [trackStates, masterVolume, isMasterMuted, hasAnySolo, tracks]);

  // Sync master volume to preview audio element
  useEffect(() => {
    if (previewAudioRef.current) {
      previewAudioRef.current.volume = isMasterMuted ? 0 : masterVolume;
    }
  }, [masterVolume, isMasterMuted]);

  // Color mapping for stem kinds
  const getStemColor = (kind: string) => {
    switch (kind) {
      case "STEM_VOCALS":
        return "#6366F1"; // Indigo
      case "STEM_DRUMS":
        return "#F43F5E"; // Coral Rose
      case "STEM_BASS":
        return "#10B981"; // Emerald
      case "STEM_PIANO":
        return "#06B6D4"; // Cyan / Teal
      case "STEM_GUITAR":
        return "#F97316"; // Vibrant Orange
      case "STEM_OTHER":
        return "#F59E0B"; // Amber
      case "STEM_INSTRUMENTAL":
        return "#8B5CF6"; // Purple
      default:
        return "#0071E3";
    }
  };

  return (
    <div className="w-full rounded-3xl backdrop-blur-2xl bg-white/90 dark:bg-[#161618]/90 border border-neutral-200/80 dark:border-white/10 shadow-apple dark:shadow-apple-dark p-6">
      {/* FIX 2: Dedicated Single-Purpose Preview Audio Node (used ONLY by individual stem Play buttons) */}
      <audio
        ref={previewAudioRef}
        preload="none"
        onTimeUpdate={(e) => {
          if (isPreviewPlaying) {
            setCurrentTime(e.currentTarget.currentTime);
            if (e.currentTarget.duration && !isNaN(e.currentTarget.duration) && duration === 0) {
              setDuration(e.currentTarget.duration);
            }
          }
        }}
        onEnded={() => {
          setIsPreviewPlaying(false);
          setPreviewTrackId(null);
        }}
        onError={() => {
          setIsPreviewPlaying(false);
          setPreviewTrackId(null);
        }}
      />

      {/* Master multi-track synchronized audio elements (used ONLY by "Play Mix") */}
      {tracks.map((t, idx) => (
        <audio
          key={t.id}
          ref={(el) => {
            if (el) audioRefs.current[t.id] = el;
          }}
          src={t.url}
          preload="auto"
          onTimeUpdate={idx === 0 ? handleMasterTimeUpdate : undefined}
          onEnded={() => {
            if (idx === 0) setIsPlaying(false);
          }}
        />
      ))}

      {/* Header & Master Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200/70 dark:border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-apple-blue/10 text-apple-blue">
              <Sliders className="w-4 h-4" />
            </span>
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              {title}
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Synchronized 4-Stem Studio Mixer • Real-Time Solo, Mute & Pan
          </p>
        </div>

        {/* Master Transport Bar */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-2">
            <Button
              variant="glass"
              size="icon"
              onClick={handleRestart}
              title="Restart"
              className="h-9 w-9"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              variant="primary"
              onClick={togglePlay}
              className="px-5 py-2 h-9 text-xs flex items-center gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-4 h-4 fill-current" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current ml-0.5" /> Play Mix
                </>
              )}
            </Button>
          </div>

          <div className="flex items-center gap-2 border-l border-neutral-200 dark:border-white/10 pl-3">
            <button
              onClick={() => setIsMasterMuted(!isMasterMuted)}
              className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
            >
              {isMasterMuted || masterVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-500" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <div className="w-20">
              <Slider
                value={isMasterMuted ? 0 : masterVolume * 100}
                min={0}
                max={100}
                onChange={(v) => {
                  setMasterVolume(v / 100);
                  if (isMasterMuted) setIsMasterMuted(false);
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Master Timeline & Scrub Bar */}
      <div className="py-4 border-b border-neutral-200/50 dark:border-white/5">
        <div className="flex items-center justify-between text-xs font-mono text-neutral-400 mb-1.5">
          <span>{formatDuration(currentTime)}</span>
          <span className="font-sans font-medium text-neutral-500">Master Scrub</span>
          <span>{formatDuration(duration)}</span>
        </div>
        <WaveformVisualizer
          currentTime={currentTime}
          duration={duration || 180}
          onSeek={handleSeek}
          accentColor="#0071E3"
          height={32}
        />
      </div>

      {/* Multi-Track Channel Strips */}
      <div className="divide-y divide-neutral-200/60 dark:divide-white/5 mt-2">
        {tracks.map((track) => {
          const state = trackStates[track.id] || {
            volume: 0.85,
            pan: 0,
            isMuted: false,
            isSolo: false,
          };
          const trackColor = getStemColor(track.kind);

          return (
            <div
              key={track.id}
              className="py-4 flex flex-col md:flex-row items-start md:items-center gap-4 transition-colors"
            >
              {/* Stem Label & Channel Meters */}
              <div className="w-full md:w-44 flex items-center justify-between md:justify-start gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-3 h-3 rounded-full shadow-sm"
                    style={{ backgroundColor: trackColor }}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                        {track.name}
                      </h4>
                      {track.clarityPercent !== undefined && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          {track.clarityPercent}% clarity
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">
                      {track.format?.toUpperCase() || "WAV"}
                      {track.sizeBytes ? ` • ${formatBytes(track.sizeBytes)}` : ""}
                    </p>
                  </div>
                </div>

                <VUMeter
                  isPlaying={
                    (isPlaying && !state.isMuted && (!hasAnySolo || state.isSolo)) ||
                    (previewTrackId === track.id && isPreviewPlaying)
                  }
                  volume={state.volume}
                  isMuted={
                    previewTrackId === track.id && isPreviewPlaying
                      ? false
                      : state.isMuted || (hasAnySolo && !state.isSolo)
                  }
                  bars={6}
                />
              </div>

              {/* Waveform Track */}
              <div className="flex-1 w-full min-w-0">
                <WaveformVisualizer
                  waveformData={track.waveformData}
                  currentTime={currentTime}
                  duration={duration || 180}
                  onSeek={handleSeek}
                  accentColor={trackColor}
                  height={32}
                />
              </div>

              {/* Track Controls: Individual Play, Solo, Mute, Pan Knob, Fader */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end shrink-0">
                <div className="flex items-center gap-1">
                  {/* Individual Stem Play / Pause Preview Button */}
                  <button
                    onClick={() => togglePreview(track)}
                    title={
                      previewTrackId === track.id && isPreviewPlaying
                        ? `Pause ${track.name} preview`
                        : `Play ${track.name} in isolation`
                    }
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      previewTrackId === track.id && isPreviewPlaying
                        ? "bg-apple-blue text-white shadow-sm ring-2 ring-apple-blue/30"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200 dark:hover:bg-neutral-700"
                    }`}
                  >
                    {previewTrackId === track.id && isPreviewPlaying ? (
                      <Pause className="w-3.5 h-3.5 fill-current" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    )}
                  </button>

                  {/* Solo Button */}
                  <button
                    onClick={() => updateTrackState(track.id, { isSolo: !state.isSolo })}
                    className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all ${
                      state.isSolo
                        ? "bg-amber-400 text-black shadow-sm"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                    }`}
                  >
                    S
                  </button>
                  {/* Mute Button */}
                  <button
                    onClick={() => updateTrackState(track.id, { isMuted: !state.isMuted })}
                    className={`w-7 h-7 rounded-lg text-[11px] font-bold transition-all ${
                      state.isMuted
                        ? "bg-red-500 text-white shadow-sm"
                        : "bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                    }`}
                  >
                    M
                  </button>
                </div>

                {/* Pan Knob */}
                <Knob
                  value={state.pan}
                  min={-100}
                  max={100}
                  size={36}
                  label="PAN"
                  accentColor={trackColor}
                  onChange={(val) => updateTrackState(track.id, { pan: val })}
                />

                {/* Volume Fader */}
                <div className="w-24 flex flex-col gap-1">
                  <Slider
                    value={state.volume * 100}
                    min={0}
                    max={100}
                    accentColor={trackColor}
                    onChange={(val) => updateTrackState(track.id, { volume: val / 100 })}
                  />
                  <span className="text-[10px] text-neutral-400 font-mono text-right">
                    {Math.round(state.volume * 100)}%
                  </span>
                </div>

                {/* Direct Stem Download */}
                <a
                  href={track.url}
                  download={`${track.name.toLowerCase().replace(/\s+/g, "_")}.${track.format || "wav"}`}
                  className="p-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 hover:bg-apple-blue hover:text-white transition-all shadow-sm"
                  title={`Download ${track.name}`}
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StemMixer;
