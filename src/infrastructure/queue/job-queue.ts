import { QueuePort, JobTaskHandler } from "@/application/ports/QueuePort";

class InProcessJobQueue implements QueuePort {
  private activeJobs = new Map<string, { abortController: AbortController }>();

  async enqueue(jobId: string, task: JobTaskHandler): Promise<void> {
    const abortController = new AbortController();
    this.activeJobs.set(jobId, { abortController });

    // Execute asynchronously in background
    setImmediate(async () => {
      try {
        await task();
      } catch (err) {
        console.error(`[JobQueue] Unhandled job execution error for ${jobId}:`, err);
      } finally {
        this.activeJobs.delete(jobId);
      }
    });
  }

  async cancel(jobId: string): Promise<boolean> {
    const job = this.activeJobs.get(jobId);
    if (!job) return false;
    job.abortController.abort();
    this.activeJobs.delete(jobId);
    return true;
  }
}

declare global {
  // eslint-disable-next-line no-var
  var jobQueue: InProcessJobQueue | undefined;
}

export const jobQueue = global.jobQueue || new InProcessJobQueue();
if (process.env.NODE_ENV !== "production") {
  global.jobQueue = jobQueue;
}

export default jobQueue;
