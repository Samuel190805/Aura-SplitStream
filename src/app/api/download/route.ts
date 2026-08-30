import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { container } from "@/lib/container";
import { Job } from "@/domain/entities/Job";
import { validateAndNormalizeSourceUrl } from "@/domain/value-objects/SourceUrlValidator";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id || null;
    const clientIp = req.headers.get("x-forwarded-for") || (req as any).ip || "127.0.0.1";

    // Rate limiting check
    const { rateLimiter } = await import("@/infrastructure/ratelimit/rate-limiter");
    const rateCheck = rateLimiter.check(userId || clientIp, "download");
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: "Download rate limit exceeded. Please wait before queuing more downloads.",
          resetTime: rateCheck.resetTime,
        },
        {
          status: 429,
          headers: rateLimiter.getRateLimitHeaders(rateCheck),
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { url, targetFormat = "mp3", qualityOrResolution = "320k", mediaType = "audio" } = body;

    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ error: "A valid URL is required" }, { status: 400 });
    }

    const validation = validateAndNormalizeSourceUrl(url.trim());
    if (validation.isDrmProtected) {
      return NextResponse.json(
        { error: "This source isn't supported — it may be DRM-protected." },
        { status: 400 }
      );
    }
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error || "Invalid URL" },
        { status: 400 }
      );
    }

    const targetUrl = validation.normalizedUrl;
    const jobId = `job_dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const job = new Job({
      id: jobId,
      userId,
      type: "MEDIA_DOWNLOAD",
      status: "PENDING",
      stage: "RESOLVING",
      progress: 0,
      message: "Queued for media download & transcoding",
      inputParams: {
        url,
        targetFormat,
        qualityOrResolution,
        mediaType,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await container.jobRepository.create(job);

    // Enqueue async execution
    await container.queue.enqueue(jobId, async () => {
      await container.downloadMediaUseCase.execute({
        jobId,
        userId,
        url,
        targetFormat: targetFormat as any,
        qualityOrResolution,
        mediaType: mediaType as any,
      });
    });

    return NextResponse.json({
      success: true,
      jobId,
      status: "PENDING",
      stage: "RESOLVING",
      message: "Download job initialized",
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to initialize media download";
    console.error("[/api/download] Error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
