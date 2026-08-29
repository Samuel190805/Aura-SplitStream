"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sliders,
  UploadCloud,
  Link2,
  Sparkles,
  Layers,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Tabs } from "@/components/ui/Tabs";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { StageStepper } from "@/components/ui/StageStepper";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { StemMixer, StemTrack } from "@/components/audio/StemMixer";
import { StemWaveSplittingHero } from "@/components/visual/StemWaveSplittingHero";
import { useRealtimeJob } from "@/lib/useRealtimeJob";

function StemSeparatorContent() {
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get("url") || "";

  const [inputMode, setInputMode] = useState<"file" | "url">(initialUrl ? "url" : "file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [outputFormat, setOutputFormat] = useState("mp3");
  const [bitrate, setBitrate] = useState("320k");
  const [separationMode, setSeparationMode] = useState<"4-stem" | "6-stem">("4-stem");
  const [useEnsemble, setUseEnsemble] = useState(false);
  const [useDenoise, setUseDenoise] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    reset,
  } = useRealtimeJob();

  useEffect(() => {
    if (initialUrl && !jobId) {
      setUrlInput(initialUrl);
      setInputMode("url");
    }
  }, [initialUrl, jobId]);

  const stagesList = [
    { id: "ANALYSIS", label: "Analysis", description: "Spectrum inspection" },
    { id: "MODEL_INFERENCE", label: "Model Inference", description: "Demucs neural de-mixing" },
    { id: "STEM_RECONSTRUCTION", label: "Reconstruction", description: "Multi-Track synthesis" },
    { id: "EXPORT", label: "Export & Integrity", description: "FFprobe verified transcode" },
  ];

  const handleStartSeparation = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (inputMode === "file" && !selectedFile) {
      setSubmitError("Please select an audio or video file to separate");
      return;
    }
    if (inputMode === "url" && !urlInput.trim()) {
      setSubmitError("Please enter a valid YouTube or media URL");
      return;
    }

    setIsSubmitting(true);

    try {
      let res: Response;

      if (inputMode === "file" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("outputFormat", outputFormat);
        formData.append("bitrate", bitrate);
        formData.append("mode", separationMode);
        formData.append("ensemble", String(useEnsemble));
        formData.append("denoise", String(useDenoise));

        res = await fetch("/api/stems/separate", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/stems/separate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: urlInput.trim(),
            outputFormat,
            bitrate,
            mode: separationMode,
            ensemble: useEnsemble,
            denoise: useDenoise,
          }),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to start stem separation");
      }

      watchJob(data.jobId);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Canonical stem order mapping
  const STEM_SORT_ORDER: Record<string, number> = {
    STEM_VOCALS: 0,
    STEM_DRUMS: 1,
    STEM_BASS: 2,
    STEM_PIANO: 3,
    STEM_GUITAR: 4,
    STEM_OTHER: 5,
    STEM_INSTRUMENTAL: 6,
  };

  // Build mixer tracks strictly from mediaAssets returned by the completed job
  const mixerTracks: StemTrack[] = (mediaAssets || [])
    .slice()
    .sort((a, b) => (STEM_SORT_ORDER[a.kind] ?? 99) - (STEM_SORT_ORDER[b.kind] ?? 99))
    .map((asset) => {
      const meta = (asset.metadata || {}) as Record<string, any>;
      return {
        id: asset.id,
        name: asset.name,
        kind: asset.kind,
        url: asset.filePath,
        waveformData: asset.waveformData,
        sizeBytes: asset.sizeBytes,
        format: asset.format,
        confidenceScore: meta.confidenceScore,
        clarityPercent: meta.clarityPercent,
      };
    });

  return (
    <div className="flex flex-col items-center gap-8 max-w-4xl mx-auto py-4">
      <PageHeader
        badge="Deep Neural Source Separation"
        title="Split any song into its parts."
        description="Demucs v4 hybrid neural networks isolate Vocals, Drums, Bass, Piano, Guitar, and Instruments with studio master precision."
      />

      {/* Signature visual moment on idle state */}
      {!isProcessing && !isCompleted && !isFailed && (
        <div className="w-full">
          <StemWaveSplittingHero />
        </div>
      )}

      {/* Main Action Card */}
      {!isProcessing && !isCompleted && (
        <Card variant="glass" className="w-full p-8 shadow-apple dark:shadow-apple-dark">
          <form onSubmit={handleStartSeparation} className="flex flex-col gap-6">
            {/* Input Mode Selector */}
            <div className="flex justify-center">
              <Tabs
                tabs={[
                  { id: "file", label: "Upload File", icon: <UploadCloud className="w-4 h-4" /> },
                  { id: "url", label: "YouTube / URL", icon: <Link2 className="w-4 h-4" /> },
                ]}
                activeTab={inputMode}
                onChange={(id) => setInputMode(id as "file" | "url")}
              />
            </div>

            {/* File Upload Zone */}
            {inputMode === "file" && (
              <FileDropzone
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                label="Drop song mix or video file here"
                sublabel="MP3, WAV, FLAC, M4A, MP4, MKV up to 200MB"
              />
            )}

            {/* URL Input */}
            {inputMode === "url" && (
              <div className="flex flex-col gap-2">
                <Input
                  label="Media URL"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  leftIcon={<Link2 className="w-4 h-4 text-apple-blue" />}
                />
                <p className="text-[11px] text-neutral-400 ml-1">
                  Audio will be resolved and downloaded server-side before running source separation.
                </p>
              </div>
            )}

            {/* Basic Options Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-neutral-200/60 dark:border-white/5">
              <Select
                label="Output Format"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                options={[
                  { value: "mp3", label: "MP3 (High Quality)" },
                  { value: "wav", label: "WAV (Uncompressed 24-bit)" },
                  { value: "flac", label: "FLAC (Lossless)" },
                ]}
              />

              <Select
                label="Bitrate / Quality"
                value={bitrate}
                onChange={(e) => setBitrate(e.target.value)}
                options={[
                  { value: "320k", label: "320 kbps (Studio Master)" },
                  { value: "256k", label: "256 kbps (Standard High)" },
                  { value: "192k", label: "192 kbps (Compact)" },
                ]}
              />
            </div>

            {/* Advanced Upgrades Toggle */}
            <div className="pt-2 border-t border-neutral-200/60 dark:border-white/5">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="text-xs font-semibold text-apple-blue hover:underline flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {showAdvanced ? "Hide Advanced Options" : "Show Advanced Options (6-Stem, Ensemble, Denoising)"}
              </button>

              {showAdvanced && (
                <div className="mt-3 p-4 rounded-2xl bg-neutral-100/70 dark:bg-white/5 border border-neutral-200/60 dark:border-white/10 flex flex-col gap-4 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Select
                      label="Stem Mode"
                      value={separationMode}
                      onChange={(e) => setSeparationMode(e.target.value as any)}
                      options={[
                        { value: "4-stem", label: "4-Stem (Vocals, Drums, Bass, Other)" },
                        { value: "6-stem", label: "6-Stem (+ Piano & Guitar Isolation)" },
                      ]}
                    />

                    <div className="flex flex-col gap-1.5 justify-center">
                      <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                        Multi-Model Ensemble
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-600 dark:text-neutral-400">
                        <input
                          type="checkbox"
                          checked={useEnsemble}
                          onChange={(e) => setUseEnsemble(e.target.checked)}
                          className="rounded text-apple-blue focus:ring-apple-blue"
                        />
                        <span>Blend Demucs + Spectral Model for cleanest isolation</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="denoise-check"
                      checked={useDenoise}
                      onChange={(e) => setUseDenoise(e.target.checked)}
                      className="rounded text-apple-blue focus:ring-apple-blue"
                    />
                    <label htmlFor="denoise-check" className="text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                      Post-separation spectral denoiser pass (removes residual bleed & noise floor)
                    </label>
                  </div>
                </div>
              )}
            </div>

            {submitError && (
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              isLoading={isSubmitting}
              className="w-full flex items-center justify-center gap-2 mt-2"
            >
              <Sliders className="w-4 h-4" /> Separate Stems Now
            </Button>
          </form>
        </Card>
      )}

      {/* Live SSE Real-Time Processing Progress Card */}
      {isProcessing && (
        <Card variant="glass" className="w-full p-8 text-center flex flex-col items-center gap-6 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-apple-blue">
            <Sparkles className="w-5 h-5 animate-spin" />
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Processing Stem Separation
            </h3>
          </div>

          <ProgressRing progress={progress} size={140} strokeWidth={10} color="#0071E3" />

          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 max-w-md">
            {message || "Running neural source separation model..."}
          </p>

          <StageStepper
            stages={stagesList}
            currentStageId={stage}
            isCompleted={isCompleted}
            isFailed={isFailed}
          />
        </Card>
      )}

      {/* Failed State Card */}
      {isFailed && (
        <Card variant="glass" className="w-full p-8 text-center flex flex-col items-center gap-4 border-red-500/30">
          <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
            Stem Separation Failed
          </h3>
          <p className="text-sm text-neutral-400 max-w-md">
            {error || "An error occurred during stem separation. Please try again."}
          </p>
          <Button variant="secondary" onClick={reset} className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" /> Try Another Audio
          </Button>
        </Card>
      )}

      {/* Completed State: Interactive Stem Studio Mixer */}
      {isCompleted && mixerTracks.length > 0 && (
        <div className="w-full flex flex-col gap-6 animate-in fade-in duration-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-500 font-semibold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>Stems Ready & Validated via FFprobe</span>
            </div>
            <Button variant="glass" size="sm" onClick={reset} className="flex items-center gap-1.5 text-xs">
              <RotateCcw className="w-3.5 h-3.5" /> Separate Another
            </Button>
          </div>

          <StemMixer tracks={mixerTracks} title="Isolated Stem Studio Mixer" />
        </div>
      )}
    </div>
  );
}

export default function StemSeparatorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 rounded-full border-2 border-apple-blue border-t-transparent animate-spin" />
        </div>
      }
    >
      <StemSeparatorContent />
    </Suspense>
  );
}
