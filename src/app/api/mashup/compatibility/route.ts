import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import { calculateCompatibility } from "@/domain/value-objects/MashupConfig";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keyA, camelotA, bpmA, keyB, camelotB, bpmB } = body;

    const compatibility = calculateCompatibility(
      keyA || "C Major",
      camelotA || "8B",
      bpmA || 120,
      keyB || "G Major",
      camelotB || "9B",
      bpmB || 124
    );

    return NextResponse.json({ success: true, compatibility });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Compatibility calculation failed";
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
