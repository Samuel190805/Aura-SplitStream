"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Languages,
  Mic,
  MicOff,
  UploadCloud,
  Volume2,
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Play,
  Download,
  Edit3,
  Loader2,
  RefreshCw,
  Sliders,
  FileAudio,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { StageStepper } from "@/components/ui/StageStepper";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { SpeechBubbleHero } from "@/components/visual/SpeechBubbleHero";
import { useRealtimeJob } from "@/lib/useRealtimeJob";
import { useGlobalAudio } from "@/components/audio/GlobalAudioPlayer";
import { SUPPORTED_LANGUAGES, findLanguageByCode } from "@/domain/value-objects/SupportedLanguages";
import { formatBytes, formatDuration } from "@/lib/utils";

export default function TranslateSpeakPage() {
  const [inputMode, setInputMode] = useState<"text" | "mic" | "audio">("text");
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sourceLanguage, setSourceLanguage] = useState("auto");
  const [targetLanguage, setTargetLanguage] = useState("es");
  const [voiceGender, setVoiceGender] = useState<"female" | "male">("female");
  const [speechSpeed, setSpeechSpeed] = useState(1.0);
  const [preserveVoice, setPreserveVoice] = useState(true);
  const [enableDiarization, setEnableDiarization] = useState(true);

  // Transcription & Translation Preview state
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isTranslatingPreview, setIsTranslatingPreview] = useState(false);

  // Live Microphone Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { playTrack } = useGlobalAudio();

  const {
    jobId,
    status,
    stage,
    progress,
    message,
    error,
    mediaAssets,
    isCompleted,
    isFailed,
    isProcessing,
    watchJob,
    reset: resetJob,
  } = useRealtimeJob();

  const stagesList = [
    { id: "TRANSCRIBING", label: "Speech-to-Text", description: "Whisper ASR" },
    { id: "TRANSLATING", label: "Neural MT", description: "Multi-lingual translation" },
    { id: "SYNTHESIZING", label: "Voice Synthesis", description: "Neural TTS" },
    { id: "EXPORT", label: "Validation", description: "FFprobe verified" },
  ];

  // Auto-translate preview when sourceText or targetLanguage changes
  useEffect(() => {
    if (!sourceText.trim()) {
      setTranslatedText("");
      return;
    }

    const timer = setTimeout(() => {
      fetchTranslationPreview(sourceText, targetLanguage, sourceLanguage);
    }, 600);

    return () => clearTimeout(timer);
  }, [sourceText, targetLanguage, sourceLanguage]);

  const fetchTranslationPreview = async (text: string, target: string, source = "auto") => {
    if (!text.trim()) return;
    setIsTranslatingPreview(true);
    try {
      const res = await fetch("/api/translate/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          targetLanguage: target,
          sourceLanguage: source,
        }),
      });
      const data = await res.json();
      if (res.ok && data.translatedText) {
        setTranslatedText(data.translatedText);
      }
    } catch {
      // ignore preview errors
    } finally {
      setIsTranslatingPreview(false);
    }
  };

  const transcribeAudioBlob = async (blob: Blob, filename = "audio.wav") => {
    setIsTranscribing(true);
    setErrorMsg(null);
    try {
      const formData = new FormData();
      formData.append("file", blob, filename);
      if (sourceLanguage && sourceLanguage !== "auto") {
        formData.append("language", sourceLanguage);
      }

      const res = await fetch("/api/translate/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.text) {
        setSourceText(data.text);
        if (data.detectedLanguage && sourceLanguage === "auto") {
          setSourceLanguage(data.detectedLanguage);
        }
      } else {
        throw new Error(data.error || "Failed to transcribe audio");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Audio transcription failed");
    } finally {
      setIsTranscribing(false);
    }
  };

  const startRecording = async () => {
    setErrorMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        setRecordedBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
        transcribeAudioBlob(blob, "mic_recording.wav");
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch {
      setErrorMsg("Microphone access denied or not available");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    if (file) {
      transcribeAudioBlob(file, file.name);
    }
  };

  const handleStartTranslation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const hasText = sourceText.trim().length > 0 || translatedText.trim().length > 0;
    const hasAudio = (inputMode === "audio" && selectedFile) || (inputMode === "mic" && recordedBlob);

    if (!hasText && !hasAudio) {
      setErrorMsg("Please enter text, record audio, or upload an audio file to translate");
      return;
    }

    setIsSubmitting(true);

    try {
      let res: Response;

      // If user has text (or transcribed text), send JSON with user-edited text directly
      if (sourceText.trim() || translatedText.trim() || inputMode === "text") {
        res = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            inputType: "text",
            sourceText: sourceText.trim(),
            translatedText: translatedText.trim(),
            sourceLanguage,
            targetLanguage,
            voiceGender,
            speed: speechSpeed,
            preserveVoice,
            enableDiarization,
          }),
        });
      } else {
        const formData = new FormData();
        formData.append("inputType", "audio");
        formData.append("sourceLanguage", sourceLanguage);
        formData.append("targetLanguage", targetLanguage);
        formData.append("voiceGender", voiceGender);
        formData.append("speed", speechSpeed.toString());
        formData.append("preserveVoice", String(preserveVoice));
        formData.append("enableDiarization", String(enableDiarization));

        if (inputMode === "audio" && selectedFile) {
          formData.append("audio", selectedFile);
        } else if (inputMode === "mic" && recordedBlob) {
          formData.append("audio", recordedBlob, "recording.wav");
        }

        res = await fetch("/api/translate", {
          method: "POST",
          body: formData,
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Translation job failed to initialize");
      }

      watchJob(data.jobId);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Translation initiation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAll = () => {
    resetJob();
    setSourceText("");
    setTranslatedText("");
    setSelectedFile(null);
    setRecordedBlob(null);
    setErrorMsg(null);
  };

  const translatedAsset = mediaAssets && mediaAssets.length > 0 ? mediaAssets[0] : null;
  const targetLangInfo = findLanguageByCode(targetLanguage);

  return (
    <div className="flex flex-col items-center gap-8 max-w-4xl mx-auto py-4">
      <PageHeader
        badge="Neural Speech-to-Speech Translation"
        title="Speak any language in your own voice."
        description="Preserve acoustic timbre, pitch, and emotion across 30+ languages with automated diarization and formant cloning."
      />

      {/* Hero Animation on Idle State */}
      {!isProcessing && !isCompleted && !isFailed && (
        <div className="w-full">
          <SpeechBubbleHero />
        </div>
      )}

      {/* Main Translation Form Card */}
      {!isProcessing && !isCompleted && (
        <Card variant="glass" className="w-full p-6 sm:p-8 shadow-apple dark:shadow-apple-dark">
          <form onSubmit={handleStartTranslation} className="flex flex-col gap-6">
            {/* Input Mode Selector */}
            <div className="flex justify-center">
              <Tabs
                tabs={[
                  { id: "text", label: "Type Text", icon: <Edit3 className="w-4 h-4" /> },
                  { id: "mic", label: "Live Microphone", icon: <Mic className="w-4 h-4" /> },
                  { id: "audio", label: "Upload Audio", icon: <UploadCloud className="w-4 h-4" /> },
                ]}
                activeTab={inputMode}
                onChange={(id) => setInputMode(id as any)}
              />
            </div>

            {/* Mode 2: Live Microphone */}
            {inputMode === "mic" && (
              <div className="flex flex-col items-center justify-center p-6 sm:p-8 rounded-3xl border border-neutral-200/80 dark:border-white/10 bg-neutral-50/50 dark:bg-neutral-900/40 gap-4 text-center">
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? "bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30 ring-4 ring-red-500/20"
                      : "bg-apple-blue text-white shadow-apple hover:scale-105"
                  }`}
                >
                  {isRecording ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
                </button>
                <div>
                  <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    {isRecording
                      ? "Recording audio... Click to stop & transcribe"
                      : isTranscribing
                      ? "Transcribing your speech via Whisper ASR..."
                      : recordedBlob
                      ? "Voice recording transcribed! Review & edit below"
                      : "Click microphone to record your voice"}
                  </h4>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Live Web Audio API • 16-bit PCM Audio Stream
                  </p>
                </div>
              </div>
            )}

            {/* Mode 3: Audio File Upload */}
            {inputMode === "audio" && (
              <div className="flex flex-col gap-3">
                <FileDropzone
                  selectedFile={selectedFile}
                  onFileSelect={handleFileSelect}
                  label="Drop voice audio recording here"
                  sublabel="MP3, WAV, M4A, AAC up to 50MB"
                />
                {isTranscribing && (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-2xl bg-apple-blue/10 text-apple-blue text-xs font-semibold">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transcribing audio recording via Whisper ASR...</span>
                  </div>
                )}
              </div>
            )}

            {/* Language & Voice Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-200/60 dark:border-white/5">
              <Select
                label="Source Language"
                value={sourceLanguage}
                onChange={(e) => setSourceLanguage(e.target.value)}
                options={[
                  { value: "auto", label: "🌐 Auto Detect Source" },
                  ...SUPPORTED_LANGUAGES.map((l) => ({
                    value: l.code,
                    label: `${l.flag} ${l.name} (${l.nativeName})`,
                  })),
                ]}
              />

              <Select
                label="Target Spoken Language"
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                options={SUPPORTED_LANGUAGES.map((l) => ({
                  value: l.code,
                  label: `${l.flag} ${l.name} (${l.nativeName})`,
                }))}
              />

              <Select
                label="Voice Profile"
                value={voiceGender}
                onChange={(e) => setVoiceGender(e.target.value as any)}
                options={[
                  { value: "female", label: "Natural Voice (Female)" },
                  { value: "male", label: "Natural Voice (Male)" },
                ]}
              />

              <Select
                label="Speech Cadence"
                value={speechSpeed.toString()}
                onChange={(e) => setSpeechSpeed(parseFloat(e.target.value))}
                options={[
                  { value: "0.85", label: "0.85x (Deliberate)" },
                  { value: "1.0", label: "1.0x (Natural)" },
                  { value: "1.15", label: "1.15x (Conversational)" },
                ]}
              />
            </div>

            {/* Bilingual Editable Text Areas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Left Box: Source Transcript / Input Text */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
                    Source Text / Transcript (Editable)
                  </label>
                  {isTranscribing && (
                    <span className="text-[11px] text-apple-blue flex items-center gap-1 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" /> Transcribing...
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={sourceText}
                  onChange={(e) => setSourceText(e.target.value)}
                  placeholder="Enter or transcribe text to translate..."
                  className="w-full rounded-2xl bg-neutral-100/80 dark:bg-neutral-800/60 border border-neutral-200/80 dark:border-white/10 p-4 text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:bg-white dark:focus:bg-neutral-900 focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20 focus:outline-none transition-all resize-none"
                />
              </div>

              {/* Right Box: Translated Spoken Text (Editable) */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-semibold text-apple-blue dark:text-apple-blue">
                    Translated Text ({targetLangInfo ? `${targetLangInfo.flag} ${targetLangInfo.name}` : targetLanguage.toUpperCase()}) (Editable)
                  </label>
                  {isTranslatingPreview && (
                    <span className="text-[11px] text-apple-blue flex items-center gap-1 font-medium">
                      <Loader2 className="w-3 h-3 animate-spin" /> Translating...
                    </span>
                  )}
                </div>
                <textarea
                  rows={4}
                  value={translatedText}
                  onChange={(e) => setTranslatedText(e.target.value)}
                  placeholder="Translated spoken text will appear here (freely editable before speaking)..."
                  className="w-full rounded-2xl bg-apple-blue/5 dark:bg-apple-blue/10 border border-apple-blue/30 p-4 text-sm font-medium text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 focus:bg-white dark:focus:bg-neutral-900 focus:border-apple-blue focus:ring-2 focus:ring-apple-blue/20 focus:outline-none transition-all resize-none"
                />
              </div>
            </div>

            {/* Advanced Voice Upgrades */}
            <div className="p-4 rounded-2xl bg-neutral-100/70 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={preserveVoice}
                  onChange={(e) => setPreserveVoice(e.target.checked)}
                  className="rounded text-apple-blue focus:ring-apple-blue"
                />
                <span>Voice-Preserving Speech (Clone acoustic pitch & timbre)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-neutral-700 dark:text-neutral-300">
                <input
                  type="checkbox"
                  checked={enableDiarization}
                  onChange={(e) => setEnableDiarization(e.target.checked)}
                  className="rounded text-apple-blue focus:ring-apple-blue"
                />
                <span>Multi-Speaker Diarization (Separate distinct voices)</span>
              </label>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Primary Action Button */}
            <Button
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              className="w-full flex items-center justify-center gap-2 mt-2 shadow-apple"
            >
              <Languages className="w-4 h-4" /> Translate & Speak
            </Button>
          </form>
        </Card>
      )}

      {/* Live SSE Real-Time Progress */}
      {isProcessing && (
        <Card variant="glass" className="w-full p-8 text-center flex flex-col items-center gap-6 animate-in fade-in">
          <div className="flex items-center gap-2 text-apple-blue">
            <Sparkles className="w-5 h-5 animate-spin" />
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Processing Speech Translation
            </h3>
          </div>

          <ProgressRing progress={progress} size={140} strokeWidth={10} color="#0071E3" />

          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 max-w-md">
            {message || "Translating & synthesizing voice..."}
          </p>

          <StageStepper
            stages={stagesList}
            currentStageId={stage}
            isCompleted={isCompleted}
            isFailed={isFailed}
          />
        </Card>
      )}

      {/* Failed State */}
      {isFailed && (
        <Card variant="glass" className="w-full p-8 text-center flex flex-col items-center gap-4 border-red-500/30">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Translation Failed
          </h3>
          <p className="text-sm text-neutral-400 max-w-md">
            {error || "An error occurred during translation. Please try again."}
          </p>
          <Button variant="secondary" onClick={resetAll} className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Try Again
          </Button>
        </Card>
      )}

      {/* Completed State: Audio Player & Bilingual Cards */}
      {isCompleted && translatedAsset && (
        <div className="w-full flex flex-col gap-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-500 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Voice Synthesized & Validated via FFprobe</span>
            </div>
            <Button variant="glass" size="sm" onClick={resetAll} className="text-xs flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Translate Another
            </Button>
          </div>

          {/* Bilingual Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card variant="glass" className="p-6">
              <div className="flex items-center justify-between mb-3 text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                <span>Original / Source Text</span>
                <span className="text-neutral-500">{translatedAsset.metadata?.sourceLanguage || "Source"}</span>
              </div>
              <p className="text-sm text-neutral-800 dark:text-neutral-200 leading-relaxed font-medium">
                {translatedAsset.metadata?.sourceText || sourceText}
              </p>
            </Card>

            <Card variant="glass" className="p-6 border-apple-blue/30 bg-apple-blue/5 dark:bg-apple-blue/10">
              <div className="flex items-center justify-between mb-3 text-xs font-semibold text-apple-blue uppercase tracking-wider">
                <span>Synthesized Spoken Text</span>
                <span>{targetLangInfo ? `${targetLangInfo.flag} ${targetLangInfo.name}` : translatedAsset.metadata?.targetLanguage?.toUpperCase()}</span>
              </div>
              <p className="text-base text-neutral-900 dark:text-neutral-100 font-semibold leading-relaxed">
                {translatedAsset.metadata?.translatedText || translatedText}
              </p>
            </Card>
          </div>

          {/* Audio Output Player Card */}
          <Card variant="glass" className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-2xl bg-apple-blue text-white flex items-center justify-center shadow-md shrink-0">
                <Volume2 className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {translatedAsset.name}
                </h4>
                <p className="text-xs text-neutral-400 font-mono mt-0.5">
                  Format: MP3 • Validated Bitrate: 192kbps • High-Res Neural Voice
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() =>
                  playTrack({
                    id: translatedAsset.id,
                    title: translatedAsset.name,
                    src: translatedAsset.filePath,
                    duration: translatedAsset.duration || 5,
                  })
                }
                className="text-xs flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Play Voice
              </Button>

              <a
                href={translatedAsset.filePath}
                download={`translated_${translatedAsset.metadata?.targetLanguage || "speech"}.mp3`}
              >
                <Button variant="glass" size="sm" className="text-xs flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Download Audio
                </Button>
              </a>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
