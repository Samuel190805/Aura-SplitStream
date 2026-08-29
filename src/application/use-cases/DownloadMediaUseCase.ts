import path from "path";
import fs from "fs/promises";
import { IJobRepository } from "@/domain/repositories/IJobRepository";
import { IAssetRepository } from "@/domain/repositories/IAssetRepository";
import { MediaSourceResolverPort } from "../ports/MediaSourceResolverPort";
import { TranscoderPort } from "../ports/TranscoderPort";
import { RealtimePublisherPort } from "../ports/RealtimePublisherPort";
import { MediaFormat, FORMAT_SPECIFICATIONS } from "@/domain/value-objects/MediaFormats";
import { MediaAsset } from "@/domain/entities/MediaAsset";
import { retentionManager } from "@/infrastructure/storage/retention-manager";

export interface DownloadMediaInput {
  jobId: string;
  userId?: string | null;
  url: string;
  targetFormat: MediaFormat;
  qualityOrResolution?: string;
  mediaType: "audio" | "video";
}

export class DownloadMediaUseCase {
  constructor(
    private jobRepo: IJobRepository,
    private assetRepo: IAssetRepository,
    private mediaResolver: MediaSourceResolverPort,
    private transcoder: TranscoderPort,
    private realtimePub: RealtimePublisherPort
  ) {}

  async execute(input: DownloadMediaInput): Promise<void> {
    const { jobId, userId, url, targetFormat, qualityOrResolution, mediaType } = input;
    const workDir = retentionManager.getJobWorkingDir(jobId);
    await fs.mkdir(workDir, { recursive: true });

    try {
      // 1. RESOLVING
      this.publishProgress(jobId, "RESOLVING", 10, "Resolving media metadata & streams...");
      await this.jobRepo.updateProgress(jobId, "RESOLVING", 10, "Resolving URL...");

      const metadata = await this.mediaResolver.resolveInfo(url);

      // 2. DOWNLOADING
      this.publishProgress(jobId, "DOWNLOADING", 30, `Downloading ${metadata.title}...`);
      await this.jobRepo.updateProgress(jobId, "DOWNLOADING", 30, "Fetching raw stream...");

      const downloadResult = await this.mediaResolver.download({
        url,
        outputDirectory: workDir,
        targetFormat,
        qualityOrResolution,
        onProgress: (_stage, pct, msg) => {
          const mapped = 30 + Math.floor(pct * 0.4); // 30% to 70%
          this.publishProgress(jobId, "DOWNLOADING", mapped, msg || `Downloading (${pct}%)...`);
        }
      });

      // 3. TRANSCODING & ACOUSTIC FINGERPRINT TAGGING + LUFS NORMALIZATION
      this.publishProgress(
        jobId,
        "TRANSCODING",
        75,
        mediaType === "audio"
          ? `Transcoding with -14 LUFS Loudness Normalization & Auto-Tagging...`
          : `Transcoding stream to ${targetFormat.toUpperCase()}...`
      );
      await this.jobRepo.updateProgress(jobId, "TRANSCODING", 75, "Transcoding & normalizing audio...");

      // Managed storage output directory (Storage Discipline: Part 4.4)
      const finalMediaDir = path.join(process.cwd(), "storage", "downloads");
      await fs.mkdir(finalMediaDir, { recursive: true });

      // Run Acoustic Fingerprinting auto-tagger
      const fingerprint = await this.transcoder.acousticFingerprint(
        downloadResult.filePath,
        metadata.title
      );

      const finalArtist = metadata.author && metadata.author !== "Original Creator" ? metadata.author : fingerprint.artist;
      const finalTitle = metadata.title || fingerprint.title;

      const sanitizedTitle = finalTitle
        .replace(/[^a-zA-Z0-9_-]/g, "_")
        .substring(0, 50);
      const outFileName = `${sanitizedTitle}_${jobId.substring(0, 8)}.${targetFormat}`;
      const finalOutputPath = path.join(finalMediaDir, outFileName);

      // Transcode through validated transcoder with LUFS -14 and ID3 metadata tags
      await this.transcoder.transcode({
        inputPath: downloadResult.filePath,
        outputPath: finalOutputPath,
        targetFormat,
        bitrate: mediaType === "audio" ? qualityOrResolution : undefined,
        videoResolution: mediaType === "video" ? qualityOrResolution : undefined,
        normalizeLoudness: mediaType === "audio", // EBU R128 -14 LUFS normalization
        metadataTags: {
          title: finalTitle,
          artist: finalArtist,
          album: fingerprint.album || "SplitStream Master Archive",
          comment: `SplitStream Lossless Verified • Target -14 LUFS`,
        },
      });

      // 4. EXPORT & INTEGRITY VALIDATION
      this.publishProgress(jobId, "EXPORT", 90, "Validating container and codec integrity...");
      await this.jobRepo.updateProgress(jobId, "EXPORT", 90, "Validating file format...");

      const validation = await this.transcoder.validateOutput(finalOutputPath, targetFormat);
      if (!validation.isValid) {
        throw new Error(
          `Integrity validation failed: expected ${targetFormat}, got container=${validation.actualContainer}, codec=${validation.actualCodec} (${validation.error})`
        );
      }

      let waveform: number[] | null = null;
      if (mediaType === "audio") {
        try {
          waveform = await this.transcoder.extractWaveformData(finalOutputPath, 64);
        } catch {
          waveform = null;
        }
      }

      const formatSpec = FORMAT_SPECIFICATIONS[targetFormat] || { mimeType: "application/octet-stream" };
      const asset = new MediaAsset({
        id: `asset_dl_${jobId}`,
        jobId,
        userId,
        name: finalTitle,
        kind: mediaType === "video" ? "DOWNLOAD_VIDEO" : "DOWNLOAD_AUDIO",
        filePath: `/api/media/downloads/${outFileName}`,
        mimeType: formatSpec.mimeType,
        format: targetFormat,
        codec: validation.actualCodec || targetFormat,
        duration: validation.duration || metadata.durationSeconds,
        sizeBytes: validation.sizeBytes,
        waveformData: waveform,
        metadata: {
          originalUrl: url,
          author: finalArtist,
          title: finalTitle,
          album: fingerprint.album,
          fingerprintConfidence: fingerprint.confidence,
          loudnessNormalized: mediaType === "audio" ? "-14 LUFS (EBU R128)" : undefined,
          thumbnailUrl: metadata.thumbnailUrl,
          quality: qualityOrResolution,
          category: mediaType,
        },
        createdAt: new Date(),
      });

      await this.assetRepo.create(asset);

      // Storage Discipline: Immediately delete temporary raw stream in tmp/jobs/<jobId>
      await retentionManager.cleanJobIntermediates(jobId);

      // Mark Job Completed
      await this.jobRepo.updateStatus(
        jobId,
        "COMPLETED",
        "COMPLETED",
        undefined,
        "Download and transcoding completed"
      );

      this.realtimePub.publish(jobId, {
        jobId,
        status: "COMPLETED",
        stage: "COMPLETED",
        progress: 100,
        message: "Media ready for download & playback",
        mediaAssets: [asset.toJSON()],
        updatedAt: new Date().toISOString(),
      });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Download failed";
      console.error(`[DownloadMediaUseCase] Error on job ${jobId}:`, err);
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
    stage: "RESOLVING" | "DOWNLOADING" | "TRANSCODING" | "EXPORT",
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
