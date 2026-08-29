import path from "path";
import fs from "fs/promises";
import { IJobRepository } from "@/domain/repositories/IJobRepository";
import { IAssetRepository } from "@/domain/repositories/IAssetRepository";
import { MediaSourceResolverPort } from "../ports/MediaSourceResolverPort";
import { SeparationProviderPort } from "../ports/SeparationProviderPort";
import { TranscoderPort } from "../ports/TranscoderPort";
import { RealtimePublisherPort } from "../ports/RealtimePublisherPort";
import { MediaAsset } from "@/domain/entities/MediaAsset";
import { StemSelection, calculateCompatibility } from "@/domain/value-objects/MashupConfig";
import { retentionManager } from "@/infrastructure/storage/retention-manager";

export interface CreateMashupInput {
  jobId: string;
  userId?: string | null;
  trackA: {
    type: "file" | "url";
    filePath?: string;
    url?: string;
    name?: string;
  };
  trackB: {
    type: "file" | "url";
    filePath?: string;
    url?: string;
    name?: string;
  };
  selection: StemSelection;
  autoKeyMatch?: boolean;
  autoTempoMatch?: boolean;
  targetBpm?: number;
  outputFormat?: "mp3" | "wav" | "flac";
}

export class CreateMashupUseCase {
  constructor(
    private jobRepo: IJobRepository,
    private assetRepo: IAssetRepository,
    private mediaResolver: MediaSourceResolverPort,
    private separationProvider: SeparationProviderPort,
    private transcoder: TranscoderPort,
    private realtimePub: RealtimePublisherPort
  ) {}

  async execute(input: CreateMashupInput): Promise<void> {
    const {
      jobId,
      userId,
      trackA,
      trackB,
      selection,
      autoKeyMatch = true,
      autoTempoMatch = true,
      targetBpm,
      outputFormat = "mp3",
    } = input;

    const workDir = retentionManager.getJobWorkingDir(jobId);
    await fs.mkdir(workDir, { recursive: true });

    try {
      // 1. RESOLVE SOURCES
      this.publishProgress(jobId, "RESOLVING", 10, "Fetching and resolving Track A & Track B sources...");
      await this.jobRepo.updateProgress(jobId, "RESOLVING", 10, "Resolving tracks...");

      let audioAPath = trackA.filePath || "";
      if (trackA.type === "url" && trackA.url) {
        const dlA = await this.mediaResolver.download({
          url: trackA.url,
          outputDirectory: path.join(workDir, "srcA"),
          targetFormat: "mp3",
        });
        audioAPath = dlA.filePath;
      }

      let audioBPath = trackB.filePath || "";
      if (trackB.type === "url" && trackB.url) {
        const dlB = await this.mediaResolver.download({
          url: trackB.url,
          outputDirectory: path.join(workDir, "srcB"),
          targetFormat: "mp3",
        });
        audioBPath = dlB.filePath;
      }

      if (!audioAPath || !audioBPath) {
        throw new Error("Both Track A and Track B audio sources must be provided");
      }

      // 2. SEPARATE STEMS FOR BOTH TRACKS (Demucs v4)
      this.publishProgress(jobId, "ANALYSIS", 30, "Isolating stems for Track A & Track B...");
      await this.jobRepo.updateProgress(jobId, "ANALYSIS", 30, "Separating stems...");

      const [sepA, sepB] = await Promise.all([
        this.separationProvider.separate(
          audioAPath,
          path.join(workDir, "stemsA"),
          undefined,
          { mode: "4-stem" }
        ),
        this.separationProvider.separate(
          audioBPath,
          path.join(workDir, "stemsB"),
          undefined,
          { mode: "4-stem" }
        ),
      ]);

      // 3. ANALYZE KEY & TEMPO COMPATIBILITY
      this.publishProgress(jobId, "MODEL_INFERENCE", 55, "Calculating harmonic Camelot key and BPM alignment...");
      await this.jobRepo.updateProgress(jobId, "MODEL_INFERENCE", 55, "Aligning pitch & tempo...");

      const [keyAInfo, keyBInfo] = await Promise.all([
        this.transcoder.detectKeyAndBpm(audioAPath),
        this.transcoder.detectKeyAndBpm(audioBPath),
      ]);

      const compatibility = calculateCompatibility(
        keyAInfo.key,
        keyAInfo.camelot,
        keyAInfo.bpm,
        keyBInfo.key,
        keyBInfo.camelot,
        keyBInfo.bpm
      );

      const effectiveTargetBpm = targetBpm || keyBInfo.bpm || compatibility.suggestedBpm;

      // 4. PREPARE & DSP-TRANSFORM SELECTED STEMS
      this.publishProgress(jobId, "STEM_RECONSTRUCTION", 75, "Applying pitch shifting and tempo stretching to stems...");
      await this.jobRepo.updateProgress(jobId, "STEM_RECONSTRUCTION", 75, "Applying DSP filters...");

      const stemsToMix: string[] = [];

      // Process Track A stems
      const trackAStemsMap: Record<string, string | undefined> = {
        vocals: sepA.stems.STEM_VOCALS,
        drums: sepA.stems.STEM_DRUMS,
        bass: sepA.stems.STEM_BASS,
        other: sepA.stems.STEM_OTHER,
      };

      for (const [stemKey, isSelected] of Object.entries(selection.trackA)) {
        if (!isSelected) continue;
        const stemPath = trackAStemsMap[stemKey];
        if (!stemPath) continue;

        let processedStem = stemPath;

        // Apply pitch shifting if autoKeyMatch is enabled
        if (autoKeyMatch && compatibility.pitchShiftSemis !== 0) {
          const shiftedPath = path.join(workDir, `A_${stemKey}_pitch_shifted.mp3`);
          await this.transcoder.pitchShift(processedStem, shiftedPath, compatibility.pitchShiftSemis);
          processedStem = shiftedPath;
        }

        // Apply tempo stretch if autoTempoMatch is enabled
        if (autoTempoMatch && keyAInfo.bpm > 0 && effectiveTargetBpm > 0) {
          const tempoRatio = effectiveTargetBpm / keyAInfo.bpm;
          if (Math.abs(tempoRatio - 1.0) > 0.02) {
            const stretchedPath = path.join(workDir, `A_${stemKey}_stretched.mp3`);
            await this.transcoder.timeStretch(processedStem, stretchedPath, tempoRatio);
            processedStem = stretchedPath;
          }
        }

        stemsToMix.push(processedStem);
      }

      // Process Track B stems
      const trackBStemsMap: Record<string, string | undefined> = {
        vocals: sepB.stems.STEM_VOCALS,
        drums: sepB.stems.STEM_DRUMS,
        bass: sepB.stems.STEM_BASS,
        other: sepB.stems.STEM_OTHER,
      };

      for (const [stemKey, isSelected] of Object.entries(selection.trackB)) {
        if (!isSelected) continue;
        const stemPath = trackBStemsMap[stemKey];
        if (!stemPath) continue;

        let processedStem = stemPath;

        // Apply tempo stretch if Track B needs tempo alignment to target BPM
        if (autoTempoMatch && keyBInfo.bpm > 0 && effectiveTargetBpm > 0) {
          const tempoRatio = effectiveTargetBpm / keyBInfo.bpm;
          if (Math.abs(tempoRatio - 1.0) > 0.02) {
            const stretchedPath = path.join(workDir, `B_${stemKey}_stretched.mp3`);
            await this.transcoder.timeStretch(processedStem, stretchedPath, tempoRatio);
            processedStem = stretchedPath;
          }
        }

        stemsToMix.push(processedStem);
      }

      if (stemsToMix.length === 0) {
        throw new Error("At least one stem must be selected to create a mashup mix");
      }

      // 5. MIXDOWN & LOUDNESS MASTERING
      this.publishProgress(jobId, "EXPORT", 90, "Muxing final mashup mixdown with -14 LUFS mastering...");
      await this.jobRepo.updateProgress(jobId, "EXPORT", 90, "Rendering final mixdown...");

      const mashupStorageDir = path.join(process.cwd(), "storage", "mashups");
      await fs.mkdir(mashupStorageDir, { recursive: true });

      const nameA = trackA.name || "Track A";
      const nameB = trackB.name || "Track B";
      const sanitizedName = `${nameA}_x_${nameB}`.replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 40);
      const outFileName = `mashup_${sanitizedName}_${jobId.substring(0, 8)}.${outputFormat}`;
      const finalOutputPath = path.join(mashupStorageDir, outFileName);

      // Mix all transformed stem tracks with balanced headroom
      const rawMixPath = path.join(workDir, `raw_mix.${outputFormat}`);
      await this.transcoder.mixAudioTracks(stemsToMix, rawMixPath);

      // Transcode with EBU R128 -14 LUFS Loudness Normalization
      await this.transcoder.transcode({
        inputPath: rawMixPath,
        outputPath: finalOutputPath,
        targetFormat: outputFormat,
        normalizeLoudness: true,
        metadataTags: {
          title: `${nameA} × ${nameB} (SplitStream AI Mashup)`,
          artist: "SplitStream Remix Studio",
          comment: `Harmonic Score: ${compatibility.scorePercent}% • Camelot: ${compatibility.camelotB}`,
        },
      });

      const validation = await this.transcoder.validateOutput(finalOutputPath, outputFormat);
      if (!validation.isValid) {
        throw new Error(`Mashup export validation failed: ${validation.error}`);
      }

      let waveform: number[] | null = null;
      try {
        waveform = await this.transcoder.extractWaveformData(finalOutputPath, 64);
      } catch {
        waveform = null;
      }

      const asset = new MediaAsset({
        id: `asset_mash_${jobId}`,
        jobId,
        userId,
        name: `${nameA} × ${nameB} (AI Mashup)`,
        kind: "MASHUP_AUDIO",
        filePath: `/api/media/mashups/${outFileName}`,
        mimeType: outputFormat === "wav" ? "audio/wav" : outputFormat === "flac" ? "audio/flac" : "audio/mpeg",
        format: outputFormat,
        codec: validation.actualCodec || outputFormat,
        duration: validation.duration,
        sizeBytes: validation.sizeBytes,
        waveformData: waveform,
        metadata: {
          trackAName: nameA,
          trackBName: nameB,
          compatibilityScore: compatibility.scorePercent,
          keyMatch: compatibility.keyMatch,
          camelotA: compatibility.camelotA,
          camelotB: compatibility.camelotB,
          bpmA: compatibility.bpmA,
          bpmB: compatibility.bpmB,
          targetBpm: effectiveTargetBpm,
          pitchShiftApplied: compatibility.pitchShiftSemis,
          pitchShiftCapped: compatibility.pitchShiftCapped,
          tempoStretchWarning: compatibility.tempoStretchWarning,
        },
        createdAt: new Date(),
      });

      await this.assetRepo.create(asset);

      // Storage Discipline: Delete all intermediate separated stems and stretched files immediately
      await retentionManager.cleanJobIntermediates(jobId);

      // Mark Job Completed
      await this.jobRepo.updateStatus(jobId, "COMPLETED", "COMPLETED", undefined, "Mashup rendered successfully");
      this.realtimePub.publish(jobId, {
        jobId,
        status: "COMPLETED",
        stage: "COMPLETED",
        progress: 100,
        message: "Mashup rendered and mastered ready for playback",
        mediaAssets: [asset.toJSON()],
        updatedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Mashup creation failed";
      console.error(`[CreateMashupUseCase] Error on job ${jobId}:`, err);
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
    }
  }

  private publishProgress(
    jobId: string,
    stage: "RESOLVING" | "ANALYSIS" | "MODEL_INFERENCE" | "STEM_RECONSTRUCTION" | "EXPORT",
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
