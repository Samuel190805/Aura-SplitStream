export interface VoiceProfile {
  pitchOffset?: number; // in semitones (-6 to +6)
  formantShift?: number;
  timbre?: "warm" | "bright" | "deep" | "crisp";
  emotion?: "excited" | "calm" | "expressive" | "neutral";
  gender?: "male" | "female" | "neutral";
}

export interface TTSOptions {
  text: string;
  language: string;
  voiceId?: string;
  gender?: "male" | "female" | "neutral";
  speed?: number;
  outputDirectory: string;
  format?: "mp3" | "wav";
  referenceAudioPath?: string; // For voice-preserving speech-to-speech cloning
  voiceProfile?: VoiceProfile;
  speakerId?: string;
}

export interface TTSResult {
  audioFilePath: string;
  durationSeconds?: number;
  format: string;
  preservedSpeakerCharacteristics?: boolean;
}

export interface TTSProviderPort {
  synthesize(options: TTSOptions): Promise<TTSResult>;
  extractVoiceProfile(audioFilePath: string): Promise<VoiceProfile>;
}
