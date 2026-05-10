"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Circle } from "lucide-react";

interface SessionProgressProps {
  current: number;
  total: number;
  scores?: (number | null)[];
}

export default function SessionProgress({
  current,
  total,
  scores = [],
}: SessionProgressProps) {
  const progressPercent = ((current - 1) / total) * 100;

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-zinc-500 font-medium">
          Question {current} of {total}
        </span>
        <span className="text-zinc-600">{Math.round(progressPercent)}% complete</span>
      </div>

      {/* Dot indicators */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => {
          const qNum = i + 1;
          const isDone = qNum < current;
          const isCurrent = qNum === current;
          const score = scores[i];

          const dotColor = isDone
            ? score !== null && score !== undefined
              ? score >= 80
                ? "bg-green-500"
                : score >= 60
                ? "bg-yellow-500"
                : "bg-red-500"
              : "bg-indigo-500"
            : isCurrent
            ? "bg-indigo-500 ring-2 ring-indigo-500/30"
            : "bg-zinc-700";

          return (
            <div key={i} className="flex-1 flex items-center gap-1.5">
              <motion.div
                initial={isCurrent ? { scale: 0.8 } : {}}
                animate={isCurrent ? { scale: [0.8, 1.1, 1] } : {}}
                transition={{ duration: 0.4 }}
                className={`h-2 w-2 rounded-full shrink-0 transition-all ${dotColor}`}
              />
              {i < total - 1 && (
                <div className="flex-1 h-px bg-zinc-800 relative overflow-hidden">
                  {isDone && (
                    <motion.div
                      className="absolute inset-0 bg-indigo-500/50"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      style={{ transformOrigin: "left" }}
                      transition={{ duration: 0.5 }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}
