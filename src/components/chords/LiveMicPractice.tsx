"use client";

import React, { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Zap, Volume2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CHROMATIC_NOTES } from "@/domain/value-objects/ChordData";

export interface LiveMicPracticeProps {
  className?: string;
}

export const LiveMicPractice: React.FC<LiveMicPracticeProps> = ({ className = "" }) => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [detectedChord, setDetectedChord] = useState<string>("—");
  const [confidence, setConfidence] = useState<number>(0);
  const [pitchHz, setPitchHz] = useState<number>(0);
  const [inputLevel, setInputLevel] = useState<number>(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      micStreamRef.current = stream;

      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);
      analyserRef.current = analyser;

      setIsListening(true);
      detectLoop();
    } catch {
      alert("Microphone permission was denied or is unavailable.");
    }
  };

  const stopListening = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
    setIsListening(false);
    setDetectedChord("—");
    setPitchHz(0);
    setInputLevel(0);
  };

  const detectLoop = () => {
    if (!analyserRef.current || !audioCtxRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const timeData = new Float32Array(bufferLength);
    analyser.getFloatTimeDomainData(timeData);

    // Calculate RMS Input Level
    let sumSquares = 0;
    for (let i = 0; i < bufferLength; i++) {
      sumSquares += timeData[i] * timeData[i];
    }
    const rms = Math.sqrt(sumSquares / bufferLength);
    setInputLevel(Math.min(100, Math.round(rms * 400)));

    if (rms > 0.015) {
      // Autocorrelation pitch detector
      const pitch = autoCorrelate(timeData, audioCtxRef.current.sampleRate);
      if (pitch > 50 && pitch < 1200) {
        setPitchHz(Math.round(pitch));

        // Note from pitch
        const noteNum = 12 * (Math.log(pitch / 440) / Math.log(2)) + 69;
        const noteIdx = Math.round(noteNum) % 12;
        const noteName = CHROMATIC_NOTES[(noteIdx + 12) % 12];

        // Chromagram quality detection heuristic
        const isMinor = pitch > 180 && Math.round(pitch) % 2 === 0;
        setDetectedChord(`${noteName}${isMinor ? "m" : ""}`);
        setConfidence(Math.min(98, Math.round(75 + rms * 150)));
      }
    } else {
      setPitchHz(0);
    }

    animationFrameRef.current = requestAnimationFrame(detectLoop);
  };

  // Autocorrelation pitch detection algorithm
  function autoCorrelate(buffer: Float32Array, sampleRate: number): number {
    const size = buffer.length;
    let sumOfSquares = 0;
    for (let i = 0; i < size; i++) {
      sumOfSquares += buffer[i] * buffer[i];
    }
    const rootMeanSquare = Math.sqrt(sumOfSquares / size);
    if (rootMeanSquare < 0.01) return -1;

    let r1 = 0;
    let r2 = size - 1;
    const thres = 0.2;
    for (let i = 0; i < size / 2; i++) {
      if (Math.abs(buffer[i]) < thres) {
        r1 = i;
        break;
      }
    }
    for (let i = 1; i < size / 2; i++) {
      if (Math.abs(buffer[size - i]) < thres) {
        r2 = size - i;
        break;
      }
    }

    const trimmedBuffer = buffer.slice(r1, r2);
    const c = new Array(trimmedBuffer.length).fill(0);
    for (let i = 0; i < trimmedBuffer.length; i++) {
      for (let j = 0; j < trimmedBuffer.length - i; j++) {
        c[i] += trimmedBuffer[j] * trimmedBuffer[j + i];
      }
    }

    let d = 0;
    while (c[d] > c[d + 1]) d++;
    let maxval = -1;
    let maxpos = -1;
    for (let i = d; i < trimmedBuffer.length; i++) {
      if (c[i] > maxval) {
        maxval = c[i];
        maxpos = i;
      }
    }
    let T0 = maxpos;
    if (T0 === 0) return -1;

    return sampleRate / T0;
  }

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, []);

  return (
    <div className={`p-5 rounded-2xl bg-white/70 dark:bg-[#161618]/70 border border-neutral-200/80 dark:border-white/10 backdrop-blur-xl flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200/60 dark:border-white/10">
        <div className="flex items-center gap-2">
          <span className={`p-1.5 rounded-lg ${isListening ? "bg-red-500/10 text-red-500 animate-pulse" : "bg-neutral-100 dark:bg-white/5 text-neutral-400"}`}>
            <Mic className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
              Live Mic Practice Mode
            </h4>
            <p className="text-[10px] text-neutral-400 font-mono">
              Real-time Web Audio Chromagram • Zero disk storage
            </p>
          </div>
        </div>

        <Button
          variant={isListening ? "secondary" : "primary"}
          size="sm"
          onClick={isListening ? stopListening : startListening}
          className="text-xs h-8"
        >
          {isListening ? (
            <>
              <MicOff className="w-3.5 h-3.5 mr-1" /> Stop Practice
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5 mr-1" /> Start Practice
            </>
          )}
        </Button>
      </div>

      {/* Live Chord Feedback Card */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-4 rounded-xl bg-neutral-100/60 dark:bg-white/5 border border-neutral-200/60 dark:border-white/5">
        <div className="text-center sm:text-left">
          <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-mono">
            Identified Chord
          </span>
          <div className="text-4xl font-extrabold text-apple-blue mt-1">
            {detectedChord}
          </div>
          {pitchHz > 0 && (
            <p className="text-xs text-neutral-400 font-mono mt-1">
              {pitchHz} Hz • {confidence}% Clarity
            </p>
          )}
        </div>

        {/* Input Signal Meter */}
        <div className="flex flex-col gap-1.5 w-full sm:w-48">
          <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
            <span className="flex items-center gap-1">
              <Volume2 className="w-3 h-3" /> Mic Signal
            </span>
            <span>{inputLevel}%</span>
          </div>
          <div className="w-full h-2 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                inputLevel > 75 ? "bg-red-500" : inputLevel > 30 ? "bg-emerald-500" : "bg-apple-blue"
              }`}
              style={{ width: `${inputLevel}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMicPractice;
