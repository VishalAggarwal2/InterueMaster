"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { TranscriptSegment } from "@/types";
import { formatDuration } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  audioUrl: string;
  transcript?: TranscriptSegment[];
  onTimeUpdate?: (time: number) => void;
}

export default function AudioPlayer({
  audioUrl,
  transcript = [],
  onTimeUpdate,
}: AudioPlayerProps) {
  const waveformRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wsRef = useRef<import("wavesurfer.js").default | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(80);
  const [currentSegment, setCurrentSegment] = useState<TranscriptSegment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ws: import("wavesurfer.js").default | null = null;

    const initWaveSurfer = async () => {
      if (!waveformRef.current) return;

      try {
        const WaveSurfer = (await import("wavesurfer.js")).default;
        ws = WaveSurfer.create({
          container: waveformRef.current,
          waveColor: "#4f46e5",
          progressColor: "#7c3aed",
          cursorColor: "#a78bfa",
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          height: 64,
          normalize: true,
          backend: "WebAudio",
        });

        wsRef.current = ws;

        ws.on("ready", () => {
          setDuration(ws!.getDuration());
          setIsLoading(false);
        });

        ws.on("audioprocess", (time: number) => {
          setCurrentTime(time);
          onTimeUpdate?.(time);

          // Update current transcript segment
          const seg = transcript.find(
            (s) => time >= s.start && time <= s.end
          );
          setCurrentSegment(seg || null);
        });

        ws.on("play", () => setIsPlaying(true));
        ws.on("pause", () => setIsPlaying(false));
        ws.on("finish", () => setIsPlaying(false));
        ws.on("error", () => {
          setError("Failed to load audio");
          setIsLoading(false);
        });

        ws.load(audioUrl);
        ws.setVolume(volume / 100);
      } catch {
        setError("WaveSurfer failed to initialize");
        setIsLoading(false);
      }
    };

    initWaveSurfer();

    return () => {
      ws?.destroy();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl]);

  useEffect(() => {
    wsRef.current?.setVolume(volume / 100);
  }, [volume]);

  const togglePlay = () => {
    wsRef.current?.playPause();
  };

  const skipBack = () => {
    wsRef.current?.skip(-10);
  };

  const skipForward = () => {
    wsRef.current?.skip(10);
  };

  const handleSeek = (value: number[]) => {
    const pct = value[0] / 100;
    wsRef.current?.seekTo(pct);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="rounded-xl bg-zinc-900 border border-zinc-800 overflow-hidden">
      {/* Waveform */}
      <div className="p-4 bg-zinc-900/50">
        {isLoading && (
          <div className="h-16 flex items-center justify-center">
            <div className="flex gap-1">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-zinc-700 rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 40 + 10}px`,
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
        {error && (
          <div className="h-16 flex items-center justify-center text-sm text-red-400">
            {error}
          </div>
        )}
        <div
          ref={waveformRef}
          className={cn(isLoading || error ? "hidden" : "block")}
        />
      </div>

      {/* Controls */}
      <div className="px-4 pb-4 space-y-3">
        {/* Seek bar */}
        <Slider
          value={[progressPercent]}
          onValueChange={handleSeek}
          max={100}
          step={0.1}
          className="cursor-pointer"
        />

        {/* Time display */}
        <div className="flex items-center justify-between text-xs font-mono text-zinc-500">
          <span>{formatDuration(Math.floor(currentTime))}</span>
          <span>{formatDuration(Math.floor(duration))}</span>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={skipBack}
              className="text-zinc-400 hover:text-zinc-100 h-8 w-8"
            >
              <SkipBack size={16} />
            </Button>

            <Button
              variant="gradient"
              size="icon"
              onClick={togglePlay}
              disabled={isLoading}
              className="h-10 w-10 rounded-full"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} />}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={skipForward}
              className="text-zinc-400 hover:text-zinc-100 h-8 w-8"
            >
              <SkipForward size={16} />
            </Button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 w-32">
            <Volume2 size={14} className="text-zinc-500 shrink-0" />
            <Slider
              value={[volume]}
              onValueChange={(v) => setVolume(v[0])}
              max={100}
              step={1}
            />
          </div>
        </div>
      </div>

      {/* Live transcript */}
      {currentSegment && (
        <div className="border-t border-zinc-800 px-4 py-3 bg-indigo-500/5">
          <p className="text-xs text-zinc-500 mb-1 uppercase tracking-wider">
            {currentSegment.speaker === "user" ? "You" : "AI Interviewer"}
          </p>
          <p className="text-sm text-zinc-200 leading-relaxed">
            {currentSegment.text}
          </p>
        </div>
      )}

      {/* Full transcript */}
      {transcript.length > 0 && (
        <div className="border-t border-zinc-800 max-h-60 overflow-y-auto">
          {transcript.map((seg, i) => (
            <div
              key={i}
              onClick={() => {
                const pct = seg.start / duration;
                wsRef.current?.seekTo(pct);
              }}
              className={cn(
                "px-4 py-2.5 border-b border-zinc-800/50 cursor-pointer hover:bg-zinc-800/50 transition-colors",
                currentSegment === seg && "bg-indigo-500/10"
              )}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] font-mono text-zinc-600">
                  {formatDuration(Math.floor(seg.start))}
                </span>
                <span
                  className={cn(
                    "text-[10px] font-semibold uppercase tracking-wider",
                    seg.speaker === "user" ? "text-indigo-400" : "text-zinc-500"
                  )}
                >
                  {seg.speaker === "user" ? "You" : "AI"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{seg.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
