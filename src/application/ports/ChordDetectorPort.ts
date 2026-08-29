import { ChordAnalysisResult } from "@/domain/value-objects/ChordData";

export interface ChordDetectorPort {
  detectChords(audioFilePath: string, bassStemPath?: string): Promise<ChordAnalysisResult>;
}
