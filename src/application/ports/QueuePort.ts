export type JobTaskHandler = () => Promise<void>;

export interface QueuePort {
  enqueue(jobId: string, task: JobTaskHandler): Promise<void>;
  cancel(jobId: string): Promise<boolean>;
}
