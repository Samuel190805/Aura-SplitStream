import { EventEmitter } from "events";
import { RealtimePublisherPort } from "@/application/ports/RealtimePublisherPort";
import { JobRealtimePayload } from "@/domain/events/JobEvents";

class RealtimeBus implements RealtimePublisherPort {
  private emitter: EventEmitter;
  private latestCache = new Map<string, JobRealtimePayload>();

  constructor() {
    this.emitter = new EventEmitter();
    this.emitter.setMaxListeners(200);
  }

  publish(jobId: string, payload: JobRealtimePayload): void {
    this.latestCache.set(jobId, payload);
    this.emitter.emit(`job:${jobId}`, payload);
  }

  subscribe(
    jobId: string,
    callback: (payload: JobRealtimePayload) => void
  ): () => void {
    const channel = `job:${jobId}`;

    // Send latest cached state immediately if present
    const cached = this.latestCache.get(jobId);
    if (cached) {
      setTimeout(() => callback(cached), 10);
    }

    this.emitter.on(channel, callback);
    return () => {
      this.emitter.off(channel, callback);
      if (this.emitter.listenerCount(channel) === 0) {
        // Clean up cache after all subscribers disconnect if job is finished
        const last = this.latestCache.get(jobId);
        if (last && (last.status === "COMPLETED" || last.status === "FAILED")) {
          setTimeout(() => this.latestCache.delete(jobId), 60000);
        }
      }
    };
  }

  getLatest(jobId: string): JobRealtimePayload | undefined {
    return this.latestCache.get(jobId);
  }
}

// Global singleton instance for Next.js runtime
declare global {
  // eslint-disable-next-line no-var
  var realtimeBus: RealtimeBus | undefined;
}

export const realtimeBus = global.realtimeBus || new RealtimeBus();
if (process.env.NODE_ENV !== "production") {
  global.realtimeBus = realtimeBus;
}

export default realtimeBus;
