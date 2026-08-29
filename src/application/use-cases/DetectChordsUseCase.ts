import path from "path";
import fs from "fs/promises";
import { IJobRepository } from "@/domain/repositories/IJobRepository";
import { IAssetRepository } from "@/domain/repositories/IAssetRepository";
import { MediaSourceResolverPort } from "../ports/MediaSourceResolverPort";
import { SeparationProviderPort } from "../ports/SeparationProviderPort";
import { ChordDetectorPort } from "../ports/ChordDetectorPort";
import { RealtimePublisherPort } from "../ports/RealtimePublisherPort";
import { MediaAsset } from "@/domain/entities/MediaAsset";
import { ChordAnalysisResult } from "@/domain/value-objects/ChordData";
import { retentionManager } from "@/infrastructure/storage/retention-manager";

export interface DetectChordsInput {
  jobId: string;
  userId?: string | null;
  inputType: "file" | "url";
  inputAudioPath?: string;
  url?: string;
}

export class DetectChordsUseCase {
  constructor(
    private jobRepo: IJobRepository,
    private assetRepo: IAssetRepository,
    private mediaResolver: MediaSourceResolverPort,
    private separationProvider: SeparationProviderPort,
    private chordDetector: ChordDetectorPort,
    private realtimePub: RealtimePublisherPort
  ) {}

  async execute(input: DetectChordsInput): Promise<ChordAnalysisResult> {
    const { jobId, userId, inputType, inputAudioPath, url } = input;
    const workDir = retentionManager.getJobWorkingDir(jobId);
    await fs.mkdir(workDir, { recursive: true });

    try {
      let targetAudioPath = inputAudioPath || "";

      // 1. RESOLVE & DOWNLOAD if URL provided
      if (inputType === "url" && url) {
        this.publishProgress(jobId, "RESOLVING", 15, "Resolving URL stream for chord extraction...");
        await this.jobRepo.updateProgress(jobId, "RESOLVING", 15, "Resolving stream...");

        const downloadResult = await this.mediaResolver.download({
          url,
          outputDirectory: workDir,
          targetFormat: "mp3",
          qualityOrResolution: "256k",
          onProgress: (_stage, pct) => {
            this.publishProgress(jobId, "RESOLVING", 15 + Math.floor(pct * 0.2), "Downloading audio stream...");
          },
        });
        targetAudioPath = downloadResult.filePath;
      }

      if (!targetAudioPath) {
        throw new Error("No valid audio file or URL provided for chord detection");
      }

      // 2. ISOLATE BASS & HARMONIC STEMS (Section 2.2 requirement)
      this.publishProgress(jobId, "ANALYSIS", 45, "Isolating Bass & Harmonic stems for clean chord frequency detection...");
      await this.jobRepo.updateProgress(jobId, "ANALYSIS", 45, "Isolating harmonic stems...");

      let bassStemPath: string | undefined = undefined;
      try {
        const separation = await this.separationProvider.separate(
          targetAudioPath,
          path.join(workDir, "stems"),
          undefined,
          { mode: "4-stem" }
        );
        bassStemPath = separation.stems.STEM_BASS;
      } catch (sepErr) {
        console.warn("[DetectChordsUseCase] Stem isolation fallback to raw audio:", sepErr);
      }

      // 3. RUN HARMONIC CHROMA CHORD DETECTION
      this.publishProgress(jobId, "MODEL_INFERENCE", 75, "Analyzing harmonic chroma spectrum & calculating progressions...");
      await this.jobRepo.updateProgress(jobId, "MODEL_INFERENCE", 75, "Extracting chord events & key...");

      const result = await this.chordDetector.detectChords(targetAudioPath, bassStemPath);

      // 4. PERSIST RESULT TO STORAGE
      const chordsStorageDir = path.join(process.cwd(), "storage", "chords");
      await fs.mkdir(chordsStorageDir, { recursive: true });

      const chordDataJsonPath = path.join(chordsStorageDir, `chords_${jobId}.json`);
      await fs.writeFile(chordDataJsonPath, JSON.stringify(result, null, 2));

      // Create Media Asset
      const asset = new MediaAsset({
        id: `asset_chords_${jobId}`,
        jobId,
        userId,
        name: `Chord Analysis - ${result.detectedKey} (${result.bpm} BPM)`,
        kind: "CHORD_PRACTICE_AUDIO",
        filePath: targetAudioPath.startsWith(process.cwd())
          ? targetAudioPath.replace(process.cwd(), "").replace(/\\/g, "/")
          : `/api/media/chords/chords_${jobId}.json`,
        mimeType: "application/json",
        format: "json",
        metadata: {
          detectedKey: result.detectedKey,
          camelotKey: result.camelotKey,
          recommendedCapo: result.recommendedCapo,
          bpm: result.bpm,
          chordCount: result.chords.length,
          chords: result.chords,
        },
        createdAt: new Date(),
      });

      await this.assetRepo.create(asset);

      // Storage Discipline: Immediately clean intermediate stem separations in tmp/jobs/<jobId>
      await retentionManager.cleanJobIntermediates(jobId);

      // Mark Job Completed
      await this.jobRepo.updateStatus(jobId, "COMPLETED", "COMPLETED", undefined, "Chord detection completed");
      this.realtimePub.publish(jobId, {
        jobId,
        status: "COMPLETED",
        stage: "COMPLETED",
        progress: 100,
        message: "Chords detected successfully",
        mediaAssets: [asset.toJSON()],
        updatedAt: new Date().toISOString(),
      });

      return result;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Chord detection failed";
      console.error(`[DetectChordsUseCase] Error on job ${jobId}:`, err);
      await retentionManager.cleanJobIntermediates(jobId);

      await this.jobRepo.updateStatus(jobId, "FAILED", "FAILED", errorMsg, errorMsg);
      this.realtimePub.publish(jobId, {
        jobId,
        status: "FAILED",
        stage: "FAILED",
        progress: 0,
        error: errorMsg,
        message: errorMsg,
        updatedAt: new Date().toISOString(),
      });
      throw err;
    }
  }

  private publishProgress(
    jobId: string,
    stage: "RESOLVING" | "ANALYSIS" | "MODEL_INFERENCE" | "EXPORT",
    progress: number,
    message?: string
  ) {
    this.realtimePub.publish(jobId, {
      jobId,
      status: "PROCESSING",
      stage,
      progress,
      message,
      updatedAt: new Date().toISOString(),
    });
  }
}
