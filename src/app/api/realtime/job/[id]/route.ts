import { NextRequest } from "next/server";
import { container } from "@/lib/container";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const resolvedParams = await Promise.resolve(context.params);
  const jobId = resolvedParams.id;
  if (!jobId) {
    return new Response("Missing job ID", { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Check initial job status from DB
      container.getJobStatusUseCase.execute(jobId).then((job) => {
        if (job) {
          const initPayload = {
            jobId: job.id,
            status: job.status,
            stage: job.stage,
            progress: job.progress,
            message: job.message,
            error: job.error,
            mediaAssets: job.mediaAssets,
            updatedAt: job.updatedAt,
          };
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(initPayload)}\n\n`));
          if (job.status === "COMPLETED" || job.status === "FAILED") {
            controller.close();
            return;
          }
        }
      });

      // Subscribe to Realtime Bus
      const unsubscribe = container.realtime.subscribe(jobId, (payload) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
          if (payload.status === "COMPLETED" || payload.status === "FAILED") {
            unsubscribe();
            setTimeout(() => {
              try {
                controller.close();
              } catch {
                // stream might already be closed
              }
            }, 1000);
          }
        } catch {
          unsubscribe();
        }
      });

      // Keepalive heartbeat
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keepalive\n\n"));
        } catch {
          clearInterval(heartbeat);
          unsubscribe();
        }
      }, 15000);

      req.signal.addEventListener("abort", () => {
        clearInterval(heartbeat);
        unsubscribe();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
