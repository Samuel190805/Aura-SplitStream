import { MediaFormat } from "@/domain/value-objects/MediaFormats";

export interface MediaMetadata {
  id: string;
  title: string;
  thumbnailUrl?: string;
  durationSeconds: number;
  author?: string;
  sourceUrl: string;
  availableAudioQualities: string[];
  availableVideoResolutions: string[];
}

export interface MediaDownloadOptions {
  url: string;
  outputDirectory: string;
  targetFormat: MediaFormat;
  qualityOrResolution?: string;
  onProgress?: (
    stage: "RESOLVING" | "DOWNLOADING" | "TRANSCODING" | "EXPORT",
    percent: number,
    message?: string
  ) => void;
}

export interface MediaSourceResolverPort {
  resolveInfo(url: string): Promise<MediaMetadata>;
  download(options: MediaDownloadOptions): Promise<{ filePath: string; format: string }>;
}
