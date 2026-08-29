"use client";

import React, { useState, useRef } from "react";
import { cn, formatBytes } from "@/lib/utils";
import { UploadCloud, FileAudio, FileVideo, X } from "lucide-react";

export interface FileDropzoneProps {
  accept?: string;
  maxSizeBytes?: number;
  onFileSelect: (file: File | null) => void;
  selectedFile: File | null;
  label?: string;
  sublabel?: string;
  className?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  accept = "audio/*,video/*",
  maxSizeBytes = 200 * 1024 * 1024, // 200MB
  onFileSelect,
  selectedFile,
  label = "Drop audio or video file here",
  sublabel = "Supports MP3, WAV, FLAC, MP4, MOV, MKV up to 200MB",
  className,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const validateAndSet = (file: File) => {
    setError(null);
    if (maxSizeBytes && file.size > maxSizeBytes) {
      setError(`File size exceeds limit (${formatBytes(maxSizeBytes)})`);
      return;
    }
    onFileSelect(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSet(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSet(e.target.files[0]);
    }
  };

  const isVideo = selectedFile?.type?.includes("video");

  return (
    <div className={cn("w-full", className)}>
      {!selectedFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative group flex flex-col items-center justify-center p-8 rounded-3xl border-2 border-dashed transition-all duration-300 cursor-pointer text-center",
            isDragOver
              ? "border-apple-blue bg-apple-blue/5 dark:bg-apple-blue/10 scale-[1.01]"
              : "border-neutral-300 dark:border-white/10 hover:border-neutral-400 dark:hover:border-white/20 bg-neutral-50/50 dark:bg-neutral-900/40"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            onChange={handleInputChange}
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-neutral-800 shadow-sm border border-neutral-200 dark:border-white/10 flex items-center justify-center text-apple-blue mb-4 group-hover:scale-105 transition-transform duration-300">
            <UploadCloud className="w-7 h-7 stroke-[1.75]" />
          </div>
          <h4 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 mb-1">
            {label}
          </h4>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 max-w-sm">
            {sublabel}
          </p>
          {error && <p className="mt-2 text-xs text-red-500 font-medium">{error}</p>}
        </div>
      ) : (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-neutral-200/80 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-apple-blue/10 dark:bg-apple-blue/20 text-apple-blue flex items-center justify-center shrink-0">
              {isVideo ? (
                <FileVideo className="w-5 h-5" />
              ) : (
                <FileAudio className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-neutral-400 font-mono">
                {formatBytes(selectedFile.size)} • {selectedFile.type || "audio/video"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              onFileSelect(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="p-1.5 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FileDropzone;
