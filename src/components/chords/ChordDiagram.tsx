"use client";

import React from "react";
import {
  GUITAR_CHORDS,
  UKULELE_CHORDS,
  PIANO_CHORD_OFFSETS,
  CHROMATIC_NOTES,
} from "@/domain/value-objects/ChordData";

export interface ChordDiagramProps {
  chord: string; // e.g. "C", "Am", "G7"
  instrument: "guitar" | "piano" | "ukulele";
  className?: string;
}

export const ChordDiagram: React.FC<ChordDiagramProps> = ({
  chord,
  instrument,
  className = "",
}) => {
  if (instrument === "guitar") {
    return <GuitarDiagram chord={chord} className={className} />;
  }
  if (instrument === "ukulele") {
    return <UkuleleDiagram chord={chord} className={className} />;
  }
  return <PianoDiagram chord={chord} className={className} />;
};

// Guitar Fretboard Diagram
function GuitarDiagram({ chord, className = "" }: { chord: string; className?: string }) {
  const frets = GUITAR_CHORDS[chord] || GUITAR_CHORDS[chord.replace(/7|maj7|sus4/g, "")] || [0, 2, 2, 0, 0, 0];

  return (
    <div className={`flex flex-col items-center p-3 rounded-2xl bg-neutral-100/80 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10 ${className}`}>
      <span className="text-base font-bold text-apple-blue mb-1">{chord}</span>
      <span className="text-[10px] text-neutral-400 uppercase tracking-wider mb-2 font-mono">Guitar</span>

      {/* SVG Fretboard (6 strings, 5 frets) */}
      <svg width="120" height="130" viewBox="0 0 120 130" className="stroke-current">
        {/* Nut (fret 0) */}
        <rect x="20" y="20" width="80" height="4" fill="currentColor" className="text-neutral-800 dark:text-neutral-200" />

        {/* 5 Fret Lines */}
        {[38, 56, 74, 92, 110].map((y) => (
          <line key={y} x1="20" y1={y} x2="100" y2={y} strokeWidth="1" stroke="currentColor" className="text-neutral-400 dark:text-neutral-600" />
        ))}

        {/* 6 String Lines */}
        {[20, 36, 52, 68, 84, 100].map((x) => (
          <line key={x} x1={x} y1="20" x2={x} y2="110" strokeWidth="1.2" stroke="currentColor" className="text-neutral-400 dark:text-neutral-500" />
        ))}

        {/* String Top Markings (X, O, or blank) */}
        {frets.map((fret, stringIdx) => {
          const x = 20 + stringIdx * 16;
          if (fret === -1) {
            return (
              <text key={`mark_${stringIdx}`} x={x} y="14" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#EF4444">
                ✕
              </text>
            );
          }
          if (fret === 0) {
            return (
              <circle key={`mark_${stringIdx}`} cx={x} cy="11" r="3" fill="none" strokeWidth="1.5" stroke="currentColor" className="text-emerald-500" />
            );
          }
          return null;
        })}

        {/* Finger Dots */}
        {frets.map((fret, stringIdx) => {
          if (fret > 0) {
            const x = 20 + stringIdx * 16;
            const y = 20 + fret * 18 - 9;
            return (
              <circle
                key={`dot_${stringIdx}`}
                cx={x}
                cy={y}
                r="5.5"
                fill="#0071E3"
                className="drop-shadow-sm animate-in zoom-in-50"
              />
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
}

// Ukulele Fretboard Diagram (4 strings G-C-E-A)
function UkuleleDiagram({ chord, className = "" }: { chord: string; className?: string }) {
  const frets = UKULELE_CHORDS[chord] || UKULELE_CHORDS[chord.replace(/7|maj7|sus4/g, "")] || [0, 0, 0, 3];

  return (
    <div className={`flex flex-col items-center p-3 rounded-2xl bg-neutral-100/80 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10 ${className}`}>
      <span className="text-base font-bold text-amber-500 mb-1">{chord}</span>
      <span className="text-[10px] text-neutral-400 uppercase tracking-wider mb-2 font-mono">Ukulele</span>

      <svg width="100" height="130" viewBox="0 0 100 130" className="stroke-current">
        {/* Nut */}
        <rect x="20" y="20" width="60" height="4" fill="currentColor" className="text-neutral-800 dark:text-neutral-200" />

        {/* Frets */}
        {[40, 60, 80, 100].map((y) => (
          <line key={y} x1="20" y1={y} x2="80" y2={y} strokeWidth="1" stroke="currentColor" className="text-neutral-400 dark:text-neutral-600" />
        ))}

        {/* 4 Strings */}
        {[20, 40, 60, 80].map((x) => (
          <line key={x} x1={x} y1="20" x2={x} y2="100" strokeWidth="1.2" stroke="currentColor" className="text-neutral-400 dark:text-neutral-500" />
        ))}

        {/* Dots */}
        {frets.map((fret, stringIdx) => {
          const x = 20 + stringIdx * 20;
          if (fret === 0) {
            return (
              <circle key={`u_mark_${stringIdx}`} cx={x} cy="11" r="3" fill="none" strokeWidth="1.5" stroke="currentColor" className="text-emerald-500" />
            );
          }
          if (fret > 0) {
            const y = 20 + fret * 20 - 10;
            return (
              <circle key={`u_dot_${stringIdx}`} cx={x} cy={y} r="5.5" fill="#F59E0B" className="drop-shadow-sm" />
            );
          }
          return null;
        })}
      </svg>
    </div>
  );
}

// Piano Keyboard Diagram
function PianoDiagram({ chord, className = "" }: { chord: string; className?: string }) {
  const match = chord.match(/^([A-G][#b]?)(.*)$/) || ["", "C", ""];
  const root = match[1];
  const suffix = match[2].includes("m") && !match[2].includes("maj") ? "min" : "maj";

  const rootIndex = CHROMATIC_NOTES.indexOf(root);
  const activeOffsets = PIANO_CHORD_OFFSETS[suffix] || [0, 4, 7];
  const activeMidi = activeOffsets.map((off) => (rootIndex + off) % 12);

  // 14 White keys (2 octaves)
  const whiteKeyPitches = [0, 2, 4, 5, 7, 9, 11, 0, 2, 4, 5, 7, 9, 11];

  return (
    <div className={`flex flex-col items-center p-3 rounded-2xl bg-neutral-100/80 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10 ${className}`}>
      <span className="text-base font-bold text-emerald-500 mb-1">{chord}</span>
      <span className="text-[10px] text-neutral-400 uppercase tracking-wider mb-2 font-mono">Piano</span>

      <div className="relative flex border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden bg-white shadow-sm h-20 w-44">
        {/* White Keys */}
        {whiteKeyPitches.map((pitch, idx) => {
          const isPressed = activeMidi.includes(pitch);
          return (
            <div
              key={`wk_${idx}`}
              className={`flex-1 border-r border-neutral-200 relative flex items-end justify-center pb-1 ${
                isPressed ? "bg-emerald-400/30" : "bg-white"
              }`}
            >
              {isPressed && <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm" />}
            </div>
          );
        })}

        {/* Black Keys (Overlay) */}
        <div className="absolute inset-0 pointer-events-none flex">
          {[0, 1, 3, 4, 5, 7, 8, 10, 11, 12].map((blackIdx, i) => {
            const leftPct = ((blackIdx + 0.65) / 14) * 100;
            return (
              <div
                key={`bk_${i}`}
                style={{ left: `${leftPct}%` }}
                className="absolute top-0 w-2.5 h-12 bg-neutral-900 border border-black rounded-b-sm shadow-sm"
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ChordDiagram;
