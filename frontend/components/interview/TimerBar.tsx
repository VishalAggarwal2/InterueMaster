"use client";

import { motion } from "framer-motion";
import { Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimerBarProps {
  timeRemaining: number;
  totalTime: number;
  isWarning?: boolean;
  isExpired?: boolean;
}

export default function TimerBar({
  timeRemaining,
  totalTime,
  isWarning,
  isExpired,
}: TimerBarProps) {
  const progress = (timeRemaining / totalTime) * 100;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;

  const barColor = isExpired
    ? "bg-red-600"
    : isWarning
    ? "bg-red-500"
    : progress > 60
    ? "bg-green-500"
    : progress > 30
    ? "bg-yellow-500"
    : "bg-orange-500";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div
          className={cn(
            "flex items-center gap-1.5 text-sm font-mono font-medium",
            isExpired
              ? "text-red-400"
              : isWarning
              ? "text-red-400"
              : "text-zinc-300"
          )}
        >
          {isWarning || isExpired ? (
            <motion.span
              animate={{ opacity: [1, 0.5] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <AlertTriangle size={14} />
            </motion.span>
          ) : (
            <Clock size={14} className="text-zinc-500" />
          )}
          {isExpired ? (
            <span>Time&apos;s up!</span>
          ) : (
            <span>
              {minutes}:{seconds.toString().padStart(2, "0")}
            </span>
          )}
        </div>
        <span className="text-xs text-zinc-600">
          {Math.round(progress)}% remaining
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full transition-colors duration-500", barColor)}
          style={{ width: `${progress}%` }}
          animate={isWarning ? { opacity: [1, 0.7] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
      </div>
    </div>
  );
}
