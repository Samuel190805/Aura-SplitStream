"use client";

import React, { useState, useEffect, useRef } from "react";
import { Sliders, Zap, Sparkles } from "lucide-react";
import { Slider } from "@/components/ui/Slider";

export interface EqualizerBand {
  frequency: number;
  label: string;
  gain: number; // -12dB to +12dB
}

export interface GraphicEqualizerProps {
  audioElement: HTMLAudioElement | HTMLVideoElement | null;
  className?: string;
}

const EQ_PRESETS: Record<string, number[]> = {
  flat: [0, 0, 0, 0, 0],
  bassBoost: [8, 5, 0, -1, -2],
  vocalEnhance: [-2, 1, 6, 4, 1],
  trebleBoost: [-3, -1, 1, 5, 8],
  electronic: [6, 3, -1, 3, 5],
  acoustic: [3, 2, 2, 4, 3],
};

export const GraphicEqualizer: React.FC<GraphicEqualizerProps> = ({
  audioElement,
  className = "",
}) => {
  const [activePreset, setActivePreset] = useState<string>("flat");
  const [bands, setBands] = useState<EqualizerBand[]>([
    { frequency: 60, label: "60Hz", gain: 0 },
    { frequency: 250, label: "250Hz", gain: 0 },
    { frequency: 1000, label: "1kHz", gain: 0 },
    { frequency: 4000, label: "4kHz", gain: 0 },
    { frequency: 12000, label: "12kHz", gain: 0 },
  ]);
  const [bassBoost, setBassBoost] = useState<number>(0); // 0 to 10
  const [loudnessEnhance, setLoudnessEnhance] = useState<boolean>(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const filterNodesRef = useRef<BiquadFilterNode[]>([]);
  const gainNodeRef = useRef<GainNode | null>(null);

  // Initialize Web Audio Graph when audio element is ready
  useEffect(() => {
    if (!audioElement) return;

    try {
      // Ensure AudioContext is created
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtxClass();
      }

      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        const resumeCtx = () => {
          ctx.resume();
          window.removeEventListener("click", resumeCtx);
        };
        window.addEventListener("click", resumeCtx);
      }

      // Connect source node only once per element
      if (!sourceNodeRef.current) {
        try {
          sourceNodeRef.current = ctx.createMediaElementSource(audioElement);
        } catch {
          // In case element already has source
        }
      }

      if (!sourceNodeRef.current) return;

      // Create filter chain
      const filters = bands.map((band, idx) => {
        const filter = ctx.createBiquadFilter();
        if (idx === 0) {
          filter.type = "lowshelf";
          filter.frequency.value = band.frequency;
        } else if (idx === bands.length - 1) {
          filter.type = "highshelf";
          filter.frequency.value = band.frequency;
        } else {
          filter.type = "peaking";
          filter.frequency.value = band.frequency;
          filter.Q.value = 1.4;
        }
        filter.gain.value = band.gain;
        return filter;
      });
      filterNodesRef.current = filters;

      // Gain / Loudness node
      const gainNode = ctx.createGain();
      gainNode.gain.value = loudnessEnhance ? 1.35 : 1.0;
      gainNodeRef.current = gainNode;

      // Chain: Source -> Filter 0 -> Filter 1 ... -> Filter N -> Gain -> Destination
      let lastNode: AudioNode = sourceNodeRef.current;
      for (const filter of filters) {
        lastNode.connect(filter);
        lastNode = filter;
      }
      lastNode.connect(gainNode);
      gainNode.connect(ctx.destination);
    } catch (err) {
      console.warn("[GraphicEqualizer] Web Audio initialization notice:", err);
    }

    return () => {
      // Clean up if needed
    };
  }, [audioElement]);

  // Update filter gains when bands change
  const handleBandChange = (index: number, gain: number) => {
    setActivePreset("custom");
    setBands((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], gain };
      return updated;
    });

    if (filterNodesRef.current[index]) {
      filterNodesRef.current[index].gain.value = gain;
    }
  };

  // Apply preset
  const applyPreset = (presetKey: string) => {
    setActivePreset(presetKey);
    const gains = EQ_PRESETS[presetKey];
    if (!gains) return;

    setBands((prev) =>
      prev.map((b, i) => {
        const gain = gains[i] ?? 0;
        if (filterNodesRef.current[i]) {
          filterNodesRef.current[i].gain.value = gain;
        }
        return { ...b, gain };
      })
    );
  };

  // Apply bass boost
  const handleBassBoostChange = (val: number) => {
    setBassBoost(val);
    if (filterNodesRef.current[0]) {
      // Add extra sub-bass gain
      filterNodesRef.current[0].gain.value = bands[0].gain + val * 1.2;
    }
  };

  // Toggle loudness enhance
  const toggleLoudness = () => {
    const next = !loudnessEnhance;
    setLoudnessEnhance(next);
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = next ? 1.35 : 1.0;
    }
  };

  return (
    <div className={`p-5 rounded-2xl bg-white/70 dark:bg-[#1c1c1e]/70 border border-neutral-200/80 dark:border-white/10 backdrop-blur-xl ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-neutral-200/60 dark:border-white/10">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-apple-blue/10 text-apple-blue">
            <Sliders className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
              Studio Graphic Equalizer
            </h4>
            <p className="text-[10px] text-neutral-400 font-mono">
              5-Band Parametric DSP • Real-time Web Audio API
            </p>
          </div>
        </div>

        {/* Preset Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {Object.keys(EQ_PRESETS).map((pKey) => (
            <button
              key={pKey}
              onClick={() => applyPreset(pKey)}
              className={`px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all capitalize ${
                activePreset === pKey
                  ? "bg-apple-blue text-white shadow-sm"
                  : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-white/10"
              }`}
            >
              {pKey === "flat"
                ? "Flat"
                : pKey === "bassBoost"
                ? "Bass Boost"
                : pKey === "vocalEnhance"
                ? "Vocals"
                : pKey === "trebleBoost"
                ? "Treble"
                : pKey}
            </button>
          ))}
        </div>
      </div>

      {/* 5-Band Sliders */}
      <div className="grid grid-cols-5 gap-3 py-5 text-center">
        {bands.map((band, idx) => (
          <div key={band.frequency} className="flex flex-col items-center gap-2">
            <span className="text-[10px] font-mono text-neutral-400">
              {band.gain > 0 ? `+${band.gain}` : band.gain}dB
            </span>
            <div className="h-28 flex items-center justify-center">
              <input
                type="range"
                min={-12}
                max={12}
                step={1}
                value={band.gain}
                onChange={(e) => handleBandChange(idx, parseInt(e.target.value, 10))}
                className="w-24 -rotate-90 origin-center cursor-pointer accent-apple-blue"
              />
            </div>
            <span className="text-[11px] font-bold text-neutral-700 dark:text-neutral-200">
              {band.label}
            </span>
          </div>
        ))}
      </div>

      {/* Enhancements Row (Bass Boost & Loudness) */}
      <div className="pt-4 border-t border-neutral-200/60 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Dynamic Bass Boost */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-100/60 dark:bg-white/5 border border-neutral-200/60 dark:border-white/5">
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${bassBoost > 0 ? "text-amber-500 fill-amber-500" : "text-neutral-400"}`} />
            <div>
              <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                Dynamic Bass
              </p>
              <p className="text-[10px] text-neutral-400">
                Sub-harmonic emphasis (+{bassBoost}dB)
              </p>
            </div>
          </div>
          <div className="w-24">
            <Slider
              value={bassBoost * 10}
              min={0}
              max={100}
              onChange={(v) => handleBassBoostChange(Math.round(v / 10))}
              accentColor="#F59E0B"
            />
          </div>
        </div>

        {/* Loudness Booster */}
        <button
          onClick={toggleLoudness}
          className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
            loudnessEnhance
              ? "bg-apple-blue/15 border-apple-blue/40 text-apple-blue shadow-sm"
              : "bg-neutral-100/60 dark:bg-white/5 border-neutral-200/60 dark:border-white/5 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60"
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <div>
              <p className="text-xs font-bold">
                Loudness Maximizer
              </p>
              <p className="text-[10px] opacity-70">
                Dynamic range compressor & headroom push
              </p>
            </div>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${loudnessEnhance ? "bg-apple-blue text-white" : "bg-neutral-200 dark:bg-white/10"}`}>
            {loudnessEnhance ? "ON" : "OFF"}
          </span>
        </button>
      </div>
    </div>
  );
};

export default GraphicEqualizer;
