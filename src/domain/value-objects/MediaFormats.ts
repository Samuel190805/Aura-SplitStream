export type AudioFormat = "mp3" | "wav" | "flac" | "m4a" | "aac" | "ogg";
export type VideoFormat = "mp4" | "webm" | "mkv";
export type MediaFormat = AudioFormat | VideoFormat;

export type AudioBitrate = "128k" | "192k" | "256k" | "320k" | "lossless";
export type VideoResolution = "1080p" | "720p" | "480p" | "360p" | "best";

export interface FormatSpecification {
  extension: MediaFormat;
  mimeType: string;
  category: "audio" | "video";
  codecDefault: string;
}

export const FORMAT_SPECIFICATIONS: Record<MediaFormat, FormatSpecification> = {
  mp3: {
    extension: "mp3",
    mimeType: "audio/mpeg",
    category: "audio",
    codecDefault: "mp3",
  },
  wav: {
    extension: "wav",
    mimeType: "audio/wav",
    category: "audio",
    codecDefault: "pcm_s16le",
  },
  flac: {
    extension: "flac",
    mimeType: "audio/flac",
    category: "audio",
    codecDefault: "flac",
  },
  m4a: {
    extension: "m4a",
    mimeType: "audio/mp4",
    category: "audio",
    codecDefault: "aac",
  },
  aac: {
    extension: "aac",
    mimeType: "audio/aac",
    category: "audio",
    codecDefault: "aac",
  },
  ogg: {
    extension: "ogg",
    mimeType: "audio/ogg",
    category: "audio",
    codecDefault: "libvorbis",
  },
  mp4: {
    extension: "mp4",
    mimeType: "video/mp4",
    category: "video",
    codecDefault: "h264",
  },
  webm: {
    extension: "webm",
    mimeType: "video/webm",
    category: "video",
    codecDefault: "vp9",
  },
  mkv: {
    extension: "mkv",
    mimeType: "video/x-matroska",
    category: "video",
    codecDefault: "h264",
  },
};
