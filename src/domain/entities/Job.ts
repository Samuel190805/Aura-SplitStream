import { JobKind, JobStage, JobStatusType } from "../value-objects/JobStatus";
import { MediaAsset } from "./MediaAsset";

export interface JobProps {
  id: string;
  userId?: string | null;
  type: JobKind;
  status: JobStatusType;
  stage: JobStage;
  progress: number;
  message?: string | null;
  inputParams: Record<string, unknown>;
  error?: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date | null;
  mediaAssets?: MediaAsset[];
}

export class Job {
  constructor(public props: JobProps) {}

  get id(): string {
    return this.props.id;
  }

  get type(): JobKind {
    return this.props.type;
  }

  get status(): JobStatusType {
    return this.props.status;
  }

  get stage(): JobStage {
    return this.props.stage;
  }

  get progress(): number {
    return this.props.progress;
  }

  get message(): string | null | undefined {
    return this.props.message;
  }

  get inputParams(): Record<string, unknown> {
    return this.props.inputParams;
  }

  get error(): string | null | undefined {
    return this.props.error;
  }

  get mediaAssets(): MediaAsset[] {
    return this.props.mediaAssets || [];
  }

  updateProgress(stage: JobStage, progress: number, message?: string) {
    this.props.stage = stage;
    this.props.progress = Math.min(100, Math.max(0, progress));
    this.props.status = "PROCESSING";
    if (message !== undefined) {
      this.props.message = message;
    }
    this.props.updatedAt = new Date();
  }

  complete(message = "Job completed successfully") {
    this.props.status = "COMPLETED";
    this.props.stage = "COMPLETED";
    this.props.progress = 100;
    this.props.message = message;
    this.props.completedAt = new Date();
    this.props.updatedAt = new Date();
  }

  fail(errorMessage: string) {
    this.props.status = "FAILED";
    this.props.stage = "FAILED";
    this.props.error = errorMessage;
    this.props.message = errorMessage;
    this.props.updatedAt = new Date();
  }

  toJSON() {
    return {
      id: this.props.id,
      userId: this.props.userId,
      type: this.props.type,
      status: this.props.status,
      stage: this.props.stage,
      progress: this.props.progress,
      message: this.props.message,
      inputParams: this.props.inputParams,
      error: this.props.error,
      createdAt: this.props.createdAt,
      updatedAt: this.props.updatedAt,
      completedAt: this.props.completedAt,
      mediaAssets: this.props.mediaAssets?.map((a) => a.toJSON()) || [],
    };
  }
}
