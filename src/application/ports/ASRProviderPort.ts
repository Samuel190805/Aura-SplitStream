export interface SpeechSegment {
  id: string;
  start: number; // in seconds
  end: number; // in seconds
  text: string;
  speakerId?: string; // "Speaker 1", "Speaker 2"
  confidence?: number;
}

export interface ASRResult {
  text: string;
  detectedLanguage?: string;
  confidence?: number;
  durationSeconds?: number;
  segments?: SpeechSegment[];
}

export interface ASRProviderPort {
  transcribe(audioFilePath: string, languageHint?: string): Promise<ASRResult>;
}
