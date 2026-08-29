import { JobStage, JobStatusType } from "../value-objects/JobStatus";
import { MediaAssetProps } from "../entities/MediaAsset";

export interface JobStageProgressEvent {
  jobId: string;
  stage: JobStage;
  progress: number;
  message?: string;
  timestamp: string;
}

export interface JobCompletedEvent {
  jobId: string;
  mediaAssets: MediaAssetProps[];
  message: string;
  completedAt: string;
}

export interface JobFailedEvent {
  jobId: string;
  error: string;
  failedAt: string;
}

export type JobRealtimePayload = {
  jobId: string;
  status: JobStatusType;
  stage: JobStage;
  progress: number;
  message?: string;
  error?: string | null;
  mediaAssets?: MediaAssetProps[];
  updatedAt: string;
};
