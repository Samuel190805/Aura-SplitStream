import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string" || !url.trim()) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const metadata = await container.mediaResolver.resolveInfo(url.trim());
    return NextResponse.json({ success: true, metadata });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to resolve media metadata";
    const status = errorMsg.includes("DRM") || errorMsg.includes("supported") || errorMsg.includes("valid") ? 400 : 500;
    return NextResponse.json({ error: errorMsg }, { status });
  }
}
