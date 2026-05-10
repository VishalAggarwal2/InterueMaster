"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, Square, Pause, Play, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecorder } from "@/hooks/useRecorder";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  sessionId: string;
  onRecordingComplete?: (url: string, blob: Blob) => void;
  onTranscript?: (text: string) => void;
}

export default function VoiceRecorder({
  sessionId,
  onRecordingComplete,
  onTranscript,
}: VoiceRecorderProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const [bars, setBars] = useState<number[]>(Array(40).fill(4));
  const animationRef = useRef<number>(0);

  const {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    isUploading,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    uploadRecording,
    resetRecording,
  } = useRecorder({ sessionId });

  // Animate waveform bars
  useEffect(() => {
    if (isRecording && !isPaused) {
      const animate = () => {
        setBars((prev) =>
          prev.map(() => Math.random() * 28 + 4)
        );
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      cancelAnimationFrame(animationRef.current);
      if (!isRecording) {
        setBars(Array(40).fill(4));
      }
    }
    return () => cancelAnimationFrame(animationRef.current);
  }, [isRecording, isPaused]);

  const handleUpload = async () => {
    const url = await uploadRecording(sessionId);
    if (url && audioBlob) {
      onRecordingComplete?.(url, audioBlob);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800">
      {/* Waveform Visualizer */}
      <div
        ref={waveformRef}
        className="flex items-center gap-0.5 h-12 w-full overflow-hidden"
      >
        {bars.map((height, i) => (
          <motion.div
            key={i}
            className={cn(
              "flex-1 rounded-full transition-none",
              isRecording && !isPaused
                ? "bg-indigo-500"
                : isPaused
                ? "bg-zinc-600"
                : "bg-zinc-700"
            )}
            animate={{ height: `${height}px` }}
            transition={{ duration: 0.05 }}
            style={{ minWidth: "2px" }}
          />
        ))}
      </div>

      {/* Duration */}
      <div className="flex items-center gap-2">
        {isRecording && (
          <motion.div
            animate={{ opacity: [1, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="h-2 w-2 rounded-full bg-red-500"
          />
        )}
        <span className="font-mono text-sm text-zinc-400">
          {formatDuration(duration)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        {!isRecording && !audioBlob && (
          <Button
            onClick={startRecording}
            variant="gradient"
            size="lg"
            className="gap-2 rounded-full px-6"
          >
            <Mic size={18} />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <>
            <Button
              onClick={isPaused ? resumeRecording : pauseRecording}
              variant="outline"
              size="icon"
              className="rounded-full border-zinc-700 hover:border-zinc-500"
            >
              {isPaused ? <Play size={18} /> : <Pause size={18} />}
            </Button>

            <Button
              onClick={stopRecording}
              variant="destructive"
              size="icon"
              className="rounded-full"
            >
              <Square size={18} />
            </Button>
          </>
        )}

        {audioBlob && !isRecording && (
          <>
            {audioUrl && (
              <audio
                src={audioUrl}
                controls
                className="h-8 w-48 opacity-80"
              />
            )}
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              variant="gradient"
              size="sm"
              className="gap-1.5"
            >
              {isUploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              {isUploading ? "Uploading..." : "Save Recording"}
            </Button>
            <Button
              onClick={resetRecording}
              variant="ghost"
              size="sm"
              className="text-zinc-500 hover:text-zinc-300"
            >
              Reset
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
