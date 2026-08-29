"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { JobRealtimePayload } from "@/domain/events/JobEvents";
import { JobStage, JobStatusType } from "@/domain/value-objects/JobStatus";

export interface UseRealtimeJobState {
  jobId: string | null;
  status: JobStatusType | "IDLE";
  stage: JobStage | "IDLE";
  progress: number;
  message?: string;
  error?: string | null;
  mediaAssets?: any[];
  isConnected: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  isProcessing: boolean;
}

export function useRealtimeJob(initialJobId?: string | null) {
  const [jobId, setJobId] = useState<string | null>(initialJobId || null);
  const [state, setState] = useState<UseRealtimeJobState>({
    jobId: initialJobId || null,
    status: "IDLE",
    stage: "IDLE",
    progress: 0,
    message: undefined,
    error: null,
    mediaAssets: undefined,
    isConnected: false,
    isCompleted: false,
    isFailed: false,
    isProcessing: false,
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  const reset = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    setJobId(null);
    setState({
      jobId: null,
      status: "IDLE",
      stage: "IDLE",
      progress: 0,
      message: undefined,
      error: null,
      mediaAssets: undefined,
      isConnected: false,
      isCompleted: false,
      isFailed: false,
      isProcessing: false,
    });
  }, []);

  const watchJob = useCallback((id: string) => {
    setJobId(id);
    setState((prev) => ({
      ...prev,
      jobId: id,
      status: "PENDING",
      stage: "ANALYSIS",
      progress: 0,
      isProcessing: true,
      isCompleted: false,
      isFailed: false,
      error: null,
    }));
  }, []);

  useEffect(() => {
    if (!jobId) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sseUrl = `/api/realtime/job/${jobId}`;
    const es = new EventSource(sseUrl);
    eventSourceRef.current = es;

    es.onopen = () => {
      setState((prev) => ({ ...prev, isConnected: true }));
    };

    es.onmessage = (e) => {
      try {
        const data: JobRealtimePayload = JSON.parse(e.data);
        const isCompleted = data.status === "COMPLETED";
        const isFailed = data.status === "FAILED";
        const isProcessing = data.status === "PROCESSING" || data.status === "PENDING";

        setState((prev) => ({
          ...prev,
          status: data.status,
          stage: data.stage,
          progress: data.progress,
          message: data.message,
          error: data.error,
          mediaAssets: data.mediaAssets || prev.mediaAssets,
          isCompleted,
          isFailed,
          isProcessing,
        }));

        if (isCompleted || isFailed) {
          es.close();
        }
      } catch (err) {
        console.error("[useRealtimeJob] SSE parse error:", err);
      }
    };

    es.onerror = () => {
      // In case of SSE disconnect or error, check fallback via /api/jobs/[id]
      fetch(`/api/jobs/${jobId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.job) {
            const isCompleted = data.job.status === "COMPLETED";
            const isFailed = data.job.status === "FAILED";
            setState((prev) => ({
              ...prev,
              status: data.job.status,
              stage: data.job.stage,
              progress: data.job.progress,
              message: data.job.message,
              error: data.job.error,
              mediaAssets: data.job.mediaAssets,
              isCompleted,
              isFailed,
              isProcessing: !isCompleted && !isFailed,
            }));
            if (isCompleted || isFailed) {
              es.close();
            }
          }
        })
        .catch(() => {});
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
    };
  }, [jobId]);

  return {
    ...state,
    watchJob,
    reset,
  };
}
