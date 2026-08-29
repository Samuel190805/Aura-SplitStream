# SplitStream — AI Audio & Video Media Suite

A focused, professional web application for AI audio/video source separation, media downloading, speech-to-speech translation, and local-first media playback. Built from scratch with **Clean Architecture (Hexagonal / Ports & Adapters)** and an **Apple-style design system**.

---

## 1. The 5 Features

### 1.1 Stem Separator (AI/ML Source Separation)
- Decomposes audio mixes into isolated stems: **Vocals, Drums, Bass, Other (Instruments), and Instrumental (Karaoke mix)**.
- Powered by Meta AI's Demucs v4 (Hybrid Transformer) microservice with DSP harmonic/percussive decomposition.
- Interactive multi-track **StemMixer** with real-time solo, mute, pan knobs, volume faders, and waveform scrubbers.
- 4-Stage Realtime SSE Progress: `Analysis` → `Model Inference` → `Stem Reconstruction` → `Export & Integrity`.

### 1.2 Link Downloader
- Direct server-side extraction and transcoding from YouTube and remote URLs via `yt-dlp`.
- Rich metadata preview (title, thumbnail, duration, author) before download.
- Audio extraction (MP3 up to 320kbps, WAV, FLAC, M4A) or Video container extraction (MP4 up to 1080p, WebM, MKV).
- Output Integrity: Transcoded via `ffmpeg` and verified via `ffprobe` before serving.

### 1.3 Translate & Speak (Speech-to-Speech Translation)
- End-to-end speech AI pipeline:
  1. **ASR (Speech-to-Text)**: Transcribes microphone or uploaded audio via Whisper.
  2. **Neural MT (Machine Translation)**: Translates into 30+ supported languages.
  3. **Neural TTS (Text-to-Speech)**: Synthesizes natural-sounding speech with customizable voice profiles and cadence.
- Also supports direct typed text input.
- Editable bilingual transcription and translation comparison cards.

### 1.4 Audio Player (Local-First Access)
- Lightweight local audio player with zero cloud telemetry.
- File and folder pickers storing tracks in browser IndexedDB.
- Turntable vinyl disc visualizer, real-time Web Audio API frequency spectrum canvas, track queue, and shuffle/loop.

### 1.5 Video Player (Local Access + YouTube Links)
- Dual mode: Local-first video files and official YouTube embed player.
- Theater controls (playback speed 0.5x–2.0x, picture-in-picture, fullscreen, timeline seeking).
- Instant quick actions: "Send to Downloader" and "Send to Stem Separator".

---

## 2. Architecture (Hexagonal / Clean Architecture)

```
src/
├── app/                          # Next.js App Router (Pages, Layouts, API Routes)
│   ├── (auth)/                   # Login & Signup
│   ├── (main)/                   # Overview, Stems, Download, Translate, Audio Player, Video Player
│   └── api/                      # REST endpoints & SSE streaming routes
├── domain/                       # Pure Enterprise Business Rules
│   ├── entities/                 # User, Job, MediaAsset
│   ├── events/                   # JobStageProgressEvent, JobCompletedEvent
│   ├── repositories/             # IJobRepository, IAssetRepository, IUserRepository
│   └── value-objects/            # SupportedLanguages, MediaFormats, JobStatus
├── application/                  # Application Business Rules (Use Cases & Ports)
│   ├── ports/                    # QueuePort, RealtimePublisherPort, SeparationProviderPort, etc.
│   └── use-cases/                # SeparateStemsUseCase, DownloadMediaUseCase, TranslateAndSpeakUseCase
├── infrastructure/               # Frameworks & Drivers (Adapters)
│   ├── persistence/prisma/       # SQLite repositories
│   ├── queue/                    # In-process asynchronous job queue
│   ├── realtime/                 # Server-Sent Events (SSE) pub/sub bus
│   └── media/                    # FFmpeg transcoder & FFprobe output validator
├── providers/                    # External Service Adapters
│   ├── separation/               # FastAPI microservice client + DSP separation
│   ├── media-resolver/           # yt-dlp resolver
│   ├── asr/                      # Whisper speech recognition
│   ├── translation/              # Neural machine translation
│   └── tts/                      # Neural voice synthesis
├── components/                   # Apple-style UI Design System & Visuals
└── lib/                          # DI Container, Auth, DB singleton, IndexedDB library
services/
└── separation-service/           # Python FastAPI Demucs/Spleeter microservice
```

---

## 3. Output Integrity (Section 5)

Every file produced by the app passes through `src/infrastructure/media/transcoder.ts`:
1. **Real Transcoding**: Encoded via FFmpeg into the target format with requested bitrates and codecs.
2. **Codec & Container Validation**: Inspected via FFprobe to verify actual streams match the file extension before saving or serving.
3. **Deterministic Fail-Safe**: Fails the job with descriptive diagnostics if format verification fails.

---

## 4. Setup & Running

### Prerequisites
- Node.js 18+ (tested on Node v24)
- Python 3.10+ (for ML separation microservice)

### Quick Start

1. Install dependencies & initialize SQLite database:
```bash
npm install
npx prisma db push
```

2. Start Next.js development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

3. (Optional) Run the Python Separation Microservice:
```bash
cd services/separation-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*(Note: If the Python service is offline, SplitStream automatically uses its built-in high-fidelity DSP separation engine seamlessly).*
