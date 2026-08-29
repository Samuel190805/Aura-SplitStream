export interface ChordEvent {
  timestamp: number; // in seconds
  chord: string; // e.g. "C", "Am", "G7", "Fmaj7"
  root: string; // e.g. "C"
  quality: "maj" | "min" | "7" | "maj7" | "min7" | "dim" | "sus4";
  confidence: number;
  durationSeconds?: number;
}

export interface ChordAnalysisResult {
  detectedKey: string; // e.g. "G Major"
  camelotKey: string; // e.g. "9B"
  recommendedCapo: number; // e.g. 2 (fret 2)
  bpm: number;
  chords: ChordEvent[];
}

export interface FingeringDiagram {
  instrument: "guitar" | "piano" | "ukulele";
  chord: string;
  frets?: number[]; // for guitar/ukulele (e.g. [-1, 3, 2, 0, 1, 0] for C on guitar)
  keys?: number[]; // for piano: semitone offsets from root (e.g. [0, 4, 7] for Major)
  fingers?: string[];
  baseFret?: number;
}

// Chromatic notes
export const CHROMATIC_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// Guitar standard fingering database (6-string E-A-D-G-B-E, -1=mute, 0=open)
export const GUITAR_CHORDS: Record<string, number[]> = {
  C: [-1, 3, 2, 0, 1, 0],
  Cm: [-1, 3, 5, 5, 4, 3],
  C7: [-1, 3, 2, 3, 1, 0],
  Cmaj7: [-1, 3, 2, 0, 0, 0],
  D: [-1, -1, 0, 2, 3, 2],
  Dm: [-1, -1, 0, 2, 3, 1],
  D7: [-1, -1, 0, 2, 1, 2],
  E: [0, 2, 2, 1, 0, 0],
  Em: [0, 2, 2, 0, 0, 0],
  E7: [0, 2, 0, 1, 0, 0],
  F: [1, 3, 3, 2, 1, 1],
  Fm: [1, 3, 3, 1, 1, 1],
  G: [3, 2, 0, 0, 0, 3],
  Gm: [3, 5, 5, 3, 3, 3],
  G7: [3, 2, 0, 0, 0, 1],
  A: [-1, 0, 2, 2, 2, 0],
  Am: [-1, 0, 2, 2, 1, 0],
  A7: [-1, 0, 2, 0, 2, 0],
  B: [-1, 2, 4, 4, 4, 2],
  Bm: [-1, 2, 4, 4, 3, 2],
  B7: [-1, 2, 1, 2, 0, 2],
};

// Ukulele fingering database (4-string G-C-E-A)
export const UKULELE_CHORDS: Record<string, number[]> = {
  C: [0, 0, 0, 3],
  Cm: [0, 3, 3, 3],
  C7: [0, 0, 0, 1],
  D: [2, 2, 2, 0],
  Dm: [2, 2, 1, 0],
  D7: [2, 0, 2, 0],
  E: [4, 4, 4, 2],
  Em: [0, 4, 3, 2],
  F: [2, 0, 1, 0],
  Fm: [1, 0, 1, 3],
  G: [0, 2, 3, 2],
  Gm: [0, 2, 3, 1],
  G7: [0, 2, 1, 2],
  A: [2, 1, 0, 0],
  Am: [2, 0, 0, 0],
  A7: [0, 1, 0, 0],
  B: [4, 3, 2, 2],
  Bm: [4, 2, 2, 2],
};

// Piano key offsets from root
export const PIANO_CHORD_OFFSETS: Record<string, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  "7": [0, 4, 7, 10],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dim: [0, 3, 6],
  sus4: [0, 5, 7],
};

// Transpose chord by semitones
export function transposeChord(chord: string, semitones: number): string {
  if (semitones === 0) return chord;
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const root = match[1];
  const suffix = match[2];

  const index = CHROMATIC_NOTES.indexOf(root);
  if (index === -1) return chord;

  const newIndex = (index + semitones + 120) % 12;
  return `${CHROMATIC_NOTES[newIndex]}${suffix}`;
}

// Simplify chord (e.g. Cmaj7 -> C, Dm7b5 -> Dm)
export function simplifyChord(chord: string): string {
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;

  const root = match[1];
  const suffix = match[2];

  if (suffix.includes("m") && !suffix.includes("maj")) {
    return `${root}m`;
  }
  return root;
}

// Calculate smart capo recommendation for guitar
export function calculateBestCapo(key: string): { fret: number; openKey: string } {
  // Easy guitar open keys: G, C, D, E, A
  const easyKeys = ["G", "C", "D", "E", "A"];
  const match = key.replace(/m|Major|Minor/g, "").trim();
  const rootIndex = CHROMATIC_NOTES.indexOf(match);

  if (rootIndex === -1) return { fret: 0, openKey: key };

  for (let fret = 1; fret <= 5; fret++) {
    const candidateIndex = (rootIndex - fret + 12) % 12;
    const candidateKey = CHROMATIC_NOTES[candidateIndex];
    if (easyKeys.includes(candidateKey)) {
      return { fret, openKey: candidateKey };
    }
  }

  return { fret: 0, openKey: key };
}
