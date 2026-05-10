"use client";

import { useState, useRef, useCallback } from "react";
import toast from "react-hot-toast";
import { recordingApi } from "@/lib/api";

interface UseRecorderOptions {
  sessionId?: string;
  onUploadComplete?: (url: string) => void;
}

interface UseRecorderReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  isUploading: boolean;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  pauseRecording: () => void;
  resumeRecording: () => void;
  uploadRecording: (sessionId: string) => Promise<string | null>;
  resetRecording: () => void;
}

export function useRecorder({
  sessionId,
  onUploadComplete,
}: UseRecorderOptions = {}): UseRecorderReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/ogg",
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: mediaRecorder.mimeType,
        });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setDuration(0);
      startTimer();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Microphone access denied";
      setError(msg);
      toast.error(msg);
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      setIsPaused(false);
      stopTimer();
    }
  }, [isRecording]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
      stopTimer();
    }
  }, [isRecording, isPaused]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
      startTimer();
    }
  }, [isPaused]);

  const uploadRecording = useCallback(
    async (sid: string): Promise<string | null> => {
      if (!audioBlob) return null;

      setIsUploading(true);
      try {
        const fileName = `recording-${sid}-${Date.now()}.webm`;
        // Get presigned URL
        const presignedRes = await recordingApi.getPresignedUrl(sid, fileName);
        const { presignedUrl, publicUrl } = presignedRes.data.data || presignedRes.data;

        // Upload directly to S3
        await fetch(presignedUrl, {
          method: "PUT",
          body: audioBlob,
          headers: { "Content-Type": audioBlob.type },
        });

        onUploadComplete?.(publicUrl);
        return publicUrl;
      } catch (err) {
        // Fallback: upload through backend
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, `recording-${Date.now()}.webm`);
          const response = await recordingApi.upload(sid, formData);
          const url = response.data.data?.url || response.data.url;
          onUploadComplete?.(url);
          return url;
        } catch (fallbackErr) {
          const msg = "Failed to upload recording";
          setError(msg);
          toast.error(msg);
          return null;
        }
      } finally {
        setIsUploading(false);
      }
    },
    [audioBlob, onUploadComplete]
  );

  const resetRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setError(null);
    chunksRef.current = [];
  }, [audioUrl]);

  return {
    isRecording,
    isPaused,
    duration,
    audioBlob,
    audioUrl,
    isUploading,
    error,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    uploadRecording,
    resetRecording,
  };
}
