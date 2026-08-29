export type JobStatusType =
  | "PENDING"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

export type JobKind =
  | "STEM_SEPARATION"
  | "MEDIA_DOWNLOAD"
  | "TRANSLATE_SPEAK"
  | "CHORD_DETECTION"
  | "MASHUP_RENDER";

export type StemSeparationStage =
  | "ANALYSIS"
  | "MODEL_INFERENCE"
  | "STEM_RECONSTRUCTION"
  | "EXPORT";

export type MediaDownloadStage =
  | "RESOLVING"
  | "DOWNLOADING"
  | "TRANSCODING"
  | "EXPORT";

export type TranslateSpeakStage =
  | "TRANSCRIBING"
  | "TRANSLATING"
  | "SYNTHESIZING"
  | "EXPORT";

export type JobStage =
  | StemSeparationStage
  | MediaDownloadStage
  | TranslateSpeakStage
  | "COMPLETED"
  | "FAILED";
