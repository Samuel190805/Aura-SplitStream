"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Video,
  Youtube,
  FolderPlus,
  FilePlus,
  Play,
  Trash2,
  Link2,
  HardDrive,
  ListVideo,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";
import { VideoPlayerView } from "@/components/video/VideoPlayerView";
import { localLibrary, LocalMediaItem } from "@/lib/localLibrary";
import { formatBytes } from "@/lib/utils";

function VideoPlayerContent() {
  const searchParams = useSearchParams();
  const initialUrl = searchParams.get("url") || "";

  const [mode, setMode] = useState<"local" | "youtube">(
    initialUrl ? "youtube" : "local"
  );
  const [youtubeUrl, setYoutubeUrl] = useState(
    initialUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  );
  const [activeYoutubeUrl, setActiveYoutubeUrl] = useState(
    initialUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  );

  const [items, setItems] = useState<LocalMediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadLocalLibrary();
  }, []);

  const loadLocalLibrary = async () => {
    try {
      const all = await localLibrary.getAllItems("video");
      setItems(all);
      if (all.length > 0 && currentIndex === -1) {
        setCurrentIndex(0);
      }
    } catch {
      // ignore
    }
  };

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      if (!file.type.includes("video") && !file.name.match(/\.(mp4|webm|mkv|mov|avi)$/i)) {
        continue;
      }

      const item: LocalMediaItem = {
        id: `video_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        title: file.name.replace(/\.[^/.]+$/, ""),
        type: "video",
        format: file.name.split(".").pop() || "mp4",
        size: file.size,
        lastModified: file.lastModified,
        url: URL.createObjectURL(file),
        addedAt: Date.now(),
      };

      await localLibrary.addItem(item);
    }

    await loadLocalLibrary();
  };

  const currentLocalTrack =
    currentIndex >= 0 && currentIndex < items.length ? items[currentIndex] : null;

  const handleApplyYoutubeUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (youtubeUrl.trim()) {
      setActiveYoutubeUrl(youtubeUrl.trim());
    }
  };

  const handleDeleteItem = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await localLibrary.removeItem(id);
    await loadLocalLibrary();
  };

  const handleClearAll = async () => {
    await localLibrary.clearAll("video");
    setItems([]);
    setCurrentIndex(-1);
  };

  return (
    <div className="flex flex-col items-center gap-8 max-w-5xl mx-auto py-4">
      <PageHeader
        badge="Local Cinema & Official Embed"
        title="Video Player"
        description="Local-first video player and official YouTube embed viewer with instant one-click export to Downloader and Stem Separator."
      />

      {/* Mode Selector */}
      <div className="flex justify-center">
        <Tabs
          tabs={[
            { id: "local", label: "Local Video Files", icon: <Video className="w-4 h-4" /> },
            { id: "youtube", label: "YouTube Embed", icon: <Youtube className="w-4 h-4" /> },
          ]}
          activeTab={mode}
          onChange={(id) => setMode(id as any)}
        />
      </div>

      {/* Hidden file & folder inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*"
        onChange={handleAddFiles}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        multiple
        // @ts-expect-error webkitdirectory is standard for folder picker
        webkitdirectory=""
        directory=""
        onChange={handleAddFiles}
        className="hidden"
      />

      {/* YouTube URL Bar */}
      {mode === "youtube" && (
        <Card variant="glass" className="w-full p-4">
          <form onSubmit={handleApplyYoutubeUrl} className="flex items-center gap-3">
            <div className="flex-1">
              <Input
                placeholder="Paste YouTube link (e.g. https://www.youtube.com/watch?v=...)"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                leftIcon={<Link2 className="w-4 h-4 text-apple-blue" />}
              />
            </div>
            <Button type="submit" size="sm" className="h-10 text-xs shrink-0">
              Load Video
            </Button>
          </form>
        </Card>
      )}

      {/* Main Video Viewport */}
      <div className="w-full">
        {mode === "youtube" ? (
          <VideoPlayerView
            mode="youtube"
            src={activeYoutubeUrl}
            title="YouTube Player (Official Embed)"
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Main Local Player */}
            <div className="lg:col-span-8 flex flex-col gap-4">
              {currentLocalTrack ? (
                <VideoPlayerView
                  mode="local"
                  src={currentLocalTrack.url}
                  title={currentLocalTrack.title}
                />
              ) : (
                <Card
                  variant="glass"
                  className="aspect-video flex flex-col items-center justify-center text-center p-8 gap-4"
                >
                  <div className="w-16 h-16 rounded-3xl bg-neutral-100 dark:bg-neutral-800 text-neutral-400 flex items-center justify-center">
                    <Video className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                      No Local Video Selected
                    </h4>
                    <p className="text-xs text-neutral-400 max-w-sm mt-1">
                      Pick local MP4, WebM, MKV, or MOV files from your device to start playback.
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs flex items-center gap-1.5"
                  >
                    <FilePlus className="w-3.5 h-3.5" /> Choose Video File
                  </Button>
                </Card>
              )}
            </div>

            {/* Local Video Queue List */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListVideo className="w-4 h-4 text-apple-blue" />
                  <h4 className="text-sm font-bold text-neutral-900 dark:text-neutral-100">
                    Local Videos ({items.length})
                  </h4>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs flex items-center gap-1"
                  >
                    <FilePlus className="w-3.5 h-3.5" /> Files
                  </Button>
                  <Button
                    variant="glass"
                    size="sm"
                    onClick={() => folderInputRef.current?.click()}
                    className="text-xs flex items-center gap-1"
                  >
                    <FolderPlus className="w-3.5 h-3.5" /> Folder
                  </Button>
                  {items.length > 0 && (
                    <button
                      onClick={handleClearAll}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 transition-colors"
                      title="Clear Queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {items.length === 0 ? (
                <Card variant="glass" className="p-6 text-center flex flex-col items-center gap-2">
                  <HardDrive className="w-6 h-6 text-neutral-400" />
                  <p className="text-xs text-neutral-400">Queue is empty</p>
                </Card>
              ) : (
                <div className="flex flex-col gap-2 max-h-[440px] overflow-y-auto pr-1">
                  {items.map((item, idx) => {
                    const isSelected = idx === currentIndex;

                    return (
                      <div
                        key={item.id}
                        onClick={() => setCurrentIndex(idx)}
                        className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "bg-apple-blue/10 dark:bg-apple-blue/15 border-apple-blue/30 shadow-sm"
                            : "bg-white/70 dark:bg-[#161618]/70 border-neutral-200/70 dark:border-white/5 hover:border-neutral-300 dark:hover:border-white/20"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "bg-apple-blue text-white"
                                : "bg-neutral-100 dark:bg-neutral-800 text-neutral-400"
                            }`}
                          >
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          </div>
                          <div className="min-w-0">
                            <h5
                              className={`text-xs font-semibold truncate ${
                                isSelected ? "text-apple-blue dark:text-apple-blueAccent font-bold" : "text-neutral-800 dark:text-neutral-200"
                              }`}
                            >
                              {item.title}
                            </h5>
                            <p className="text-[10px] text-neutral-400 font-mono">
                              {item.format.toUpperCase()} • {formatBytes(item.size)}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleDeleteItem(item.id, e)}
                          className="p-1 rounded-lg text-neutral-400 hover:text-red-500 opacity-0 group-hover:opacity-100 hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function VideoPlayerPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 rounded-full border-2 border-apple-blue border-t-transparent animate-spin" />
        </div>
      }
    >
      <VideoPlayerContent />
    </Suspense>
  );
}
