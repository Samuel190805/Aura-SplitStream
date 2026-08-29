import { JobRealtimePayload } from "@/domain/events/JobEvents";

export interface RealtimePublisherPort {
  publish(jobId: string, payload: JobRealtimePayload): void;
  subscribe(
    jobId: string,
    callback: (payload: JobRealtimePayload) => void
  ): () => void;
}
