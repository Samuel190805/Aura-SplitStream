"use client";

import React, { useRef, useEffect } from "react";

export interface AudioVisualizerCanvasProps {
  isPlaying: boolean;
  audioRef?: React.RefObject<HTMLAudioElement>;
  barCount?: number;
  height?: number;
  color?: string;
  className?: string;
}

export const AudioVisualizerCanvas: React.FC<AudioVisualizerCanvasProps> = ({
  isPlaying,
  barCount = 36,
  height = 48,
  color = "#0071E3",
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const barWidth = canvas.width / barCount - 2;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 4;
        if (isPlaying) {
          const sinVal = Math.sin(phase + i * 0.3) * 0.5 + 0.5;
          const cosVal = Math.cos(phase * 1.5 + i * 0.2) * 0.5 + 0.5;
          barHeight = Math.max(4, (sinVal * 0.6 + cosVal * 0.4) * (canvas.height - 6));
        }

        const x = i * (barWidth + 2);
        const y = (canvas.height - barHeight) / 2;

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 4);
        ctx.fill();
      }

      if (isPlaying) {
        phase += 0.08;
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, barCount, color]);

  return (
    <canvas
      ref={canvasRef}
      width={320}
      height={height}
      className={className}
    />
  );
};

export default AudioVisualizerCanvas;
