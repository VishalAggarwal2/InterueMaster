"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface UseTimerOptions {
  initialTime: number;
  onExpire?: () => void;
  onWarning?: (timeLeft: number) => void;
  warningThreshold?: number;
  autoStart?: boolean;
}

interface UseTimerReturn {
  timeRemaining: number;
  isRunning: boolean;
  isExpired: boolean;
  isWarning: boolean;
  progress: number;
  formattedTime: string;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: (newTime?: number) => void;
  stop: () => void;
}

export function useTimer({
  initialTime,
  onExpire,
  onWarning,
  warningThreshold = 30,
  autoStart = false,
}: UseTimerOptions): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isExpired, setIsExpired] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningFiredRef = useRef(false);
  const initialTimeRef = useRef(initialTime);

  useEffect(() => {
    initialTimeRef.current = initialTime;
    setTimeRemaining(initialTime);
  }, [initialTime]);

  useEffect(() => {
    if (!isRunning) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          intervalRef.current = null;
          setIsRunning(false);
          setIsExpired(true);
          onExpire?.();
          return 0;
        }

        const next = prev - 1;

        // Fire warning once
        if (next <= warningThreshold && !warningFiredRef.current) {
          warningFiredRef.current = true;
          onWarning?.(next);
        }

        return next;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onExpire, onWarning, warningThreshold]);

  const start = useCallback(() => {
    setIsExpired(false);
    setIsRunning(true);
  }, []);

  const pause = useCallback(() => {
    setIsRunning(false);
  }, []);

  const resume = useCallback(() => {
    if (!isExpired) {
      setIsRunning(true);
    }
  }, [isExpired]);

  const stop = useCallback(() => {
    setIsRunning(false);
    setIsExpired(true);
  }, []);

  const reset = useCallback((newTime?: number) => {
    const resetTo = newTime ?? initialTimeRef.current;
    setTimeRemaining(resetTo);
    setIsRunning(false);
    setIsExpired(false);
    warningFiredRef.current = false;
  }, []);

  const isWarning = timeRemaining <= warningThreshold && !isExpired;

  const progress =
    initialTimeRef.current > 0
      ? (timeRemaining / initialTimeRef.current) * 100
      : 0;

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const formattedTime = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return {
    timeRemaining,
    isRunning,
    isExpired,
    isWarning,
    progress,
    formattedTime,
    start,
    pause,
    resume,
    reset,
    stop,
  };
}
