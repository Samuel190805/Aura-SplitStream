import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import path from "path";
import fs from "fs/promises";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const languageHint = (formData.get("language") as string) || undefined;

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    const tmpDir = path.join(process.cwd(), "tmp", "asr");
    await fs.mkdir(tmpDir, { recursive: true });

    const tempAudioPath = path.join(tmpDir, `asr_${Date.now()}_${file.name || "mic.wav"}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(tempAudioPath, buffer);

    const asrResult = await container.asrProvider.transcribe(tempAudioPath, languageHint);

    return NextResponse.json({
      success: true,
      text: asrResult.text,
      detectedLanguage: asrResult.detectedLanguage,
      confidence: asrResult.confidence,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "ASR transcription failed";
    console.error("[/api/translate/transcribe] Error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
