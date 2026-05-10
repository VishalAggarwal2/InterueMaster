"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Headphones, ArrowLeft, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import AuthGuard from "@/components/layout/AuthGuard";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import AudioPlayer from "@/components/recording/AudioPlayer";
import { recordingApi } from "@/lib/api";
import { Recording } from "@/types";
import { formatDuration, formatFileSize, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

export default function RecordingsPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [recording, setRecording] = useState<Recording | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await recordingApi.getBySession(sessionId);
        const data = response.data.data || response.data;
        setRecording(data);
      } catch {
        toast.error("Recording not found");
        router.push(`/history/${sessionId}`);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [sessionId, router]);

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-zinc-950">
          <Navbar />
          <Sidebar />
          <main className="lg:pl-60 pt-16">
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-4">
              <Skeleton className="h-40 rounded-xl" />
              <Skeleton className="h-80 rounded-xl" />
            </div>
          </main>
        </div>
      </AuthGuard>
    );
  }

  if (!recording) return null;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-zinc-950">
        <Navbar />
        <Sidebar />

        <main className="lg:pl-60 pt-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.back()}
                className="text-zinc-500 hover:text-zinc-300"
              >
                <ArrowLeft size={18} />
              </Button>
              <div>
                <h1 className="text-xl font-bold text-zinc-100 flex items-center gap-2">
                  <Headphones size={20} className="text-indigo-400" />
                  Session Recording
                </h1>
                <p className="text-sm text-zinc-500">
                  {formatDate(recording.createdAt)}
                </p>
              </div>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                <Clock size={14} className="text-zinc-600" />
                {formatDuration(recording.duration)}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-zinc-400">
                <FileText size={14} className="text-zinc-600" />
                {formatFileSize(recording.fileSize)}
              </div>
              {recording.transcript?.length > 0 && (
                <Badge variant="indigo" className="text-xs">
                  {recording.transcript.length} transcript segments
                </Badge>
              )}
            </div>

            {/* Audio Player */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <AudioPlayer
                audioUrl={recording.audioUrl}
                transcript={recording.transcript}
                onTimeUpdate={setCurrentTime}
              />
            </motion.div>

            {/* Full transcript */}
            {recording.transcript?.length > 0 && (
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-zinc-300">
                    Full Transcript
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recording.transcript.map((seg, i) => (
                    <motion.div
                      key={i}
                      className={`p-3 rounded-lg ${
                        seg.speaker === "user"
                          ? "bg-indigo-500/5 border border-indigo-500/20"
                          : "bg-zinc-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant={seg.speaker === "user" ? "indigo" : "outline"}
                          className="text-[10px] py-0 px-1.5 border-zinc-700"
                        >
                          {seg.speaker === "user" ? "You" : "AI Interviewer"}
                        </Badge>
                        <span className="text-[10px] font-mono text-zinc-700">
                          {formatDuration(Math.floor(seg.start))} →{" "}
                          {formatDuration(Math.floor(seg.end))}
                        </span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {seg.text}
                      </p>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Button
              variant="outline"
              onClick={() => router.push(`/history/${sessionId}`)}
              className="border-zinc-700 text-zinc-400 hover:text-zinc-100 gap-2"
            >
              <ArrowLeft size={15} />
              Back to Session
            </Button>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
