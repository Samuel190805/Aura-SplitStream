import { NextRequest, NextResponse } from "next/server";
import { container } from "@/lib/container";

export async function POST(req: NextRequest) {
  try {
    const { text, targetLanguage = "es", sourceLanguage = "auto" } = await req.json();

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const result = await container.translationProvider.translate(
      text.trim(),
      targetLanguage,
      sourceLanguage
    );

    return NextResponse.json({
      success: true,
      translatedText: result.translatedText,
      sourceLanguage: result.sourceLanguage,
      targetLanguage: result.targetLanguage,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Translation failed";
    console.error("[/api/translate/text] Error:", err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}
