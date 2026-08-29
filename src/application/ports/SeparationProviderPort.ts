export interface SeparationOptions {
  mode?: "4-stem" | "6-stem";
  ensemble?: boolean;
  denoise?: boolean;
}

export interface SeparationResult {
  vocalsPath: string;
  drumsPath: string;
  bassPath: string;
  otherPath: string;
  pianoPath?: string;
  guitarPath?: string;
  instrumentalPath?: string;
  stems: {
    STEM_VOCALS: string;
    STEM_DRUMS: string;
    STEM_BASS: string;
    STEM_OTHER: string;
    STEM_PIANO?: string;
    STEM_GUITAR?: string;
    STEM_INSTRUMENTAL?: string;
  };
  confidenceScores: Record<string, number>;
  modelUsed: string;
  durationSeconds?: number;
}

export type SeparationProgressCallback = (
  stage: "ANALYSIS" | "MODEL_INFERENCE" | "STEM_RECONSTRUCTION" | "EXPORT",
  progressPercent: number,
  message?: string
) => void;

export interface SeparationProviderPort {
  separate(
    audioFilePath: string,
    outputDirectory: string,
    onProgress?: SeparationProgressCallback,
    options?: SeparationOptions
  ): Promise<SeparationResult>;
  isServiceAvailable(): Promise<boolean>;
}
