import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";
import path from "path";
import fs from "fs/promises";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const languageHint = (formData.get("language") as string) || undefined;

    if (!file || file.size < 256) {
      return NextResponse.json(
        { error: "A valid non-empty audio file or recording is required (minimum 256 bytes)." },
        { status: 400 }
      );
    }

    const tmpDir = path.join(process.cwd(), "tmp", "asr");
    await fs.mkdir(tmpDir, { recursive: true });

    const safeExt = path.extname(file.name) || ".wav";
    const tempAudioPath = path.join(tmpDir, `asr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}${safeExt}`);
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(tempAudioPath, buffer);

    console.log(`[/api/translate/transcribe] Processing upload: ${file.name} (${buffer.length} bytes, Language: ${languageHint || "auto"})`);

    const asrResult = await container.asrProvider.transcribe(tempAudioPath, languageHint);

    // Clean up temporary upload
    await fs.unlink(tempAudioPath).catch(() => {});

    console.log(`[/api/translate/transcribe] Transcription success (${asrResult.text.length} chars, duration: ${asrResult.durationSeconds}s): "${asrResult.text}"`);

    return NextResponse.json({
      success: true,
      text: asrResult.text,
      detectedLanguage: asrResult.detectedLanguage,
      confidence: asrResult.confidence,
      durationSeconds: asrResult.durationSeconds,
      segments: asrResult.segments,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "ASR speech transcription failed";
    console.error("[/api/translate/transcribe] Error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
