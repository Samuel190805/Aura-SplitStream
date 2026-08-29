"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Music,
  UploadCloud,
  Link2,
  Sparkles,
  Sliders,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Repeat,
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { FileDropzone } from "@/components/ui/FileDropzone";
import { StageStepper } from "@/components/ui/StageStepper";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { WaveformVisualizer } from "@/components/audio/WaveformVisualizer";
import { ChordDiagram } from "@/components/chords/ChordDiagram";
import { ChordChart } from "@/components/chords/ChordChart";
import { LiveMicPractice } from "@/components/chords/LiveMicPractice";
import { ChordHero } from "@/components/visual/ChordHero";
import { ChordAnalysisResult, ChordEvent, transposeChord, simplifyChord } from "@/domain/value-objects/ChordData";
import { useRealtimeJob } from "@/lib/useRealtimeJob";
import { formatDuration } from "@/lib/utils";

function ChordDetectorContent() {
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get("url") || "";

  const [inputMode, setInputMode] = useState<"file" | "url">(initialUrl ? "url" : "file");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [urlInput, setUrlInput] = useState<string>(initialUrl);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Analysis Result State
  const [chordResult, setChordResult] = useState<ChordAnalysisResult | null>(null);
  const [audioUrl, setAudioUrl] = useState<string>("");

  // Playback & Transpose Controls
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(180);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [transpose, setTranspose] = useState<number>(0); // -6 to +6 semitones
  const [isSimplified, setIsSimplified] = useState<boolean>(false);
  const [selectedInstrument, setSelectedInstrument] = useState<"guitar" | "piano" | "ukulele">("guitar");

  // A-B Looping
  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  const stagesList = [
    { id: "RESOLVING", label: "Resolving", description: "Stream extraction" },
    { id: "ANALYSIS", label: "Harmonic Split", description: "Stem isolation" },
    { id: "MODEL_INFERENCE", label: "Chroma Detection", description: "Chord identification" },
    { id: "COMPLETED", label: "Ready", description: "Visual chord chart" },
  ];

  // When job completes, extract chord analysis result from media asset metadata
  useEffect(() => {
    if (isCompleted && mediaAssets && mediaAssets.length > 0) {
      const asset = mediaAssets[0];
      const meta = (asset.metadata || {}) as any;
      if (meta.chords) {
        setChordResult({
          detectedKey: meta.detectedKey || "C Major",
          camelotKey: meta.camelotKey || "8B",
          recommendedCapo: meta.recommendedCapo || 0,
          bpm: meta.bpm || 120,
          chords: meta.chords as ChordEvent[],
        });
      }
      if (asset.filePath) {
        setAudioUrl(asset.filePath);
      }
    }
  }, [isCompleted, mediaAssets]);

  const handleStartDetection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (inputMode === "file" && !selectedFile) {
      setSubmitError("Please select an audio file to analyze");
      return;
    }
    if (inputMode === "url" && !urlInput.trim()) {
      setSubmitError("Please enter a valid media or YouTube URL");
      return;
    }

    setIsSubmitting(true);

    try {
      let res: Response;

      if (inputMode === "file" && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        res = await fetch("/api/chords/detect", {
          method: "POST",
          body: formData,
        });
      } else {
        res = await fetch("/api/chords/detect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: urlInput.trim() }),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to start chord detection");
      }

      watchJob(data.jobId);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  // Handle loop boundary enforcement
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const cur = audioRef.current.currentTime;
    setCurrentTime(cur);

    if (loopStart !== null && loopEnd !== null && loopEnd > loopStart) {
      if (cur >= loopEnd || cur < loopStart) {
        audioRef.current.currentTime = loopStart;
      }
    }
  };

  // Find active chord
  const activeChordEvent = chordResult?.chords.find((c, i) => {
    const nextTime = chordResult.chords[i + 1]?.timestamp ?? duration;
    return currentTime >= c.timestamp && currentTime < nextTime;
  }) || chordResult?.chords[0];

  const currentDisplayChord = activeChordEvent
    ? isSimplified
      ? simplifyChord(transposeChord(activeChordEvent.chord, transpose))
      : transposeChord(activeChordEvent.chord, transpose)
    : "C";

  return (
    <div className="flex flex-col items-center gap-8 max-w-5xl mx-auto py-4">
      <PageHeader
        badge="Harmonic AI Stem Chroma Extraction"
        title="Master every chord in real time."
        description="Stem-isolated harmonic chromagrams detect chords and keys with interactive Guitar, Piano, and Ukulele charts and live microphone practice."
      />

      {/* Signature visual moment on idle state */}
      {!isProcessing && !isCompleted && !isFailed && (
        <div className="w-full">
          <ChordHero />
        </div>
      )}

      {/* Input Card */}
      {!isProcessing && !isCompleted && (
        <Card variant="glass" className="w-full p-8 shadow-apple dark:shadow-apple-dark">
          <form onSubmit={handleStartDetection} className="flex flex-col gap-6">
            <div className="flex justify-center">
              <Tabs
                tabs={[
                  { id: "file", label: "Upload Audio", icon: <UploadCloud className="w-4 h-4" /> },
                  { id: "url", label: "YouTube / URL", icon: <Link2 className="w-4 h-4" /> },
                ]}
                activeTab={inputMode}
                onChange={(id) => setInputMode(id as "file" | "url")}
              />
            </div>

            {inputMode === "file" && (
              <FileDropzone
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                label="Drop song mix or instrumental file here"
                sublabel="MP3, WAV, FLAC, M4A up to 100MB"
              />
            )}

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
                  Bass & Harmonic stems will be isolated automatically for optimal chord clarity.
                </p>
              </div>
            )}

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
              <Music className="w-4 h-4" /> Detect Chords Now
            </Button>
          </form>
        </Card>
      )}

      {/* Live Progress Card */}
      {isProcessing && (
        <Card variant="glass" className="w-full p-8 text-center flex flex-col items-center gap-6 animate-in fade-in">
          <div className="flex items-center gap-2 text-apple-blue">
            <Sparkles className="w-5 h-5 animate-spin" />
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
              Extracting Harmonic Chroma & Chords
            </h3>
          </div>

          <ProgressRing progress={progress} size={140} strokeWidth={10} color="#F59E0B" />

          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 max-w-md">
            {message || "Analyzing Bass stem spectrum and chord progressions..."}
          </p>

          <StageStepper
            stages={stagesList}
            currentStageId={stage}
            isCompleted={isCompleted}
            isFailed={isFailed}
          />
        </Card>
      )}

      {/* Results View */}
      {isCompleted && chordResult && (
        <div className="w-full flex flex-col gap-6 animate-in fade-in">
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white/80 dark:bg-[#161618]/80 border border-neutral-200/80 dark:border-white/10 backdrop-blur-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 font-bold text-xs">
                  {chordResult.detectedKey} ({chordResult.camelotKey})
                </span>
                <span className="text-xs font-mono text-neutral-400">
                  {chordResult.bpm} BPM
                </span>
              </div>
              <h3 className="text-lg font-extrabold text-neutral-900 dark:text-white mt-1">
                Detected Progression & Transposition
              </h3>
            </div>

            {/* Smart Capo Pill */}
            {chordResult.recommendedCapo > 0 && (
              <div className="px-3 py-1.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Guitar Capo: Fret {chordResult.recommendedCapo}</span>
              </div>
            )}

            <Button variant="glass" size="sm" onClick={reset} className="text-xs">
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Analyze Another
            </Button>
          </div>

          {/* Hidden Audio Player */}
          {audioUrl && (
            <audio
              ref={audioRef}
              src={audioUrl}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onEnded={() => setIsPlaying(false)}
            />
          )}

          {/* Interactive Player & Tools Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Active Chord Diagram & Instrument Selector (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Instrument Toggle */}
              <div className="flex justify-center">
                <Tabs
                  tabs={[
                    { id: "guitar", label: "Guitar" },
                    { id: "piano", label: "Piano" },
                    { id: "ukulele", label: "Ukulele" },
                  ]}
                  activeTab={selectedInstrument}
                  onChange={(id) => setSelectedInstrument(id as any)}
                />
              </div>

              {/* Visual Diagram */}
              <ChordDiagram
                chord={currentDisplayChord}
                instrument={selectedInstrument}
                className="h-[280px] justify-center"
              />

              {/* Transpose & Simplification Controls */}
              <Card variant="glass" className="p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
                    Transpose: {transpose > 0 ? `+${transpose}` : transpose} Semitones
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => setTranspose((t) => Math.max(-6, t - 1))}
                      className="h-7 w-7 text-xs p-0"
                    >
                      -
                    </Button>
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => setTranspose(0)}
                      className="h-7 text-xs px-2 font-mono"
                    >
                      0
                    </Button>
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => setTranspose((t) => Math.min(6, t + 1))}
                      className="h-7 w-7 text-xs p-0"
                    >
                      +
                    </Button>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-600 dark:text-neutral-400 pt-2 border-t border-neutral-200/60 dark:border-white/5">
                  <input
                    type="checkbox"
                    checked={isSimplified}
                    onChange={(e) => setIsSimplified(e.target.checked)}
                    className="rounded text-apple-blue focus:ring-apple-blue"
                  />
                  <span>Simplify Complex Chords (e.g. Cmaj7 → C)</span>
                </label>
              </Card>
            </div>

            {/* Right Column: Scrolling Timeline, Transport, A-B Looper & Live Mic (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              {/* Scrolling Chord Chart */}
              <ChordChart
                chords={chordResult.chords}
                currentTime={currentTime}
                duration={duration}
                transposeSemis={transpose}
                isSimplified={isSimplified}
                loopStart={loopStart}
                loopEnd={loopEnd}
                onSeek={handleSeek}
              />

              {/* Audio Transport Card */}
              <Card variant="glass" className="p-5 flex flex-col gap-4">
                <div className="flex items-center justify-between text-xs font-mono text-neutral-400">
                  <span>{formatDuration(currentTime)}</span>
                  <span>{formatDuration(duration)}</span>
                </div>

                <WaveformVisualizer
                  currentTime={currentTime}
                  duration={duration || 180}
                  onSeek={handleSeek}
                  accentColor="#F59E0B"
                  height={32}
                />

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-neutral-200/60 dark:border-white/10">
                  {/* Play / Pause */}
                  <div className="flex items-center gap-3">
                    <Button
                      variant="primary"
                      onClick={togglePlay}
                      className="w-10 h-10 rounded-xl flex items-center justify-center bg-amber-500 hover:bg-amber-600 shadow-sm"
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      )}
                    </Button>

                    <div className="flex items-center gap-1 text-xs font-mono">
                      <span className="text-neutral-400">Speed:</span>
                      {[0.5, 0.75, 1.0, 1.25].map((spd) => (
                        <button
                          key={spd}
                          onClick={() => handleSpeedChange(spd)}
                          className={`px-2 py-1 rounded-lg transition-all ${
                            playbackSpeed === spd
                              ? "bg-amber-500 text-white font-bold"
                              : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-300"
                          }`}
                        >
                          {spd}x
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* A-B Looper Controls */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => setLoopStart(currentTime)}
                      className={`text-xs h-8 ${loopStart !== null ? "border-amber-500 text-amber-500" : ""}`}
                    >
                      Set A {loopStart !== null && `(${formatDuration(loopStart)})`}
                    </Button>
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={() => setLoopEnd(currentTime)}
                      className={`text-xs h-8 ${loopEnd !== null ? "border-amber-500 text-amber-500" : ""}`}
                    >
                      Set B {loopEnd !== null && `(${formatDuration(loopEnd)})`}
                    </Button>
                    {(loopStart !== null || loopEnd !== null) && (
                      <button
                        onClick={() => {
                          setLoopStart(null);
                          setLoopEnd(null);
                        }}
                        className="text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
                      >
                        Clear Loop
                      </button>
                    )}
                  </div>
                </div>
              </Card>

              {/* Live Mic Practice Mode */}
              <LiveMicPractice />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChordDetectorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" />
        </div>
      }
    >
      <ChordDetectorContent />
    </Suspense>
  );
}
