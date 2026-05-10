"use client";

import { motion } from "framer-motion";
import { STARScore } from "@/types";
import { cn } from "@/lib/utils";

interface ScoreBreakdownProps {
  starScore: STARScore;
  animated?: boolean;
}

const STAR_LABELS = {
  situation: { label: "Situation", description: "Context clarity", emoji: "📍" },
  task: { label: "Task", description: "Goal definition", emoji: "🎯" },
  action: { label: "Action", description: "Steps taken", emoji: "⚡" },
  result: { label: "Result", description: "Impact & outcomes", emoji: "🏆" },
};

function ScoreBar({
  value,
  label,
  description,
  emoji,
  delay = 0,
  animated = true,
}: {
  value: number;
  label: string;
  description: string;
  emoji: string;
  delay?: number;
  animated?: boolean;
}) {
  const color =
    value >= 80
      ? "bg-green-500"
      : value >= 60
      ? "bg-yellow-500"
      : "bg-red-500";

  const textColor =
    value >= 80
      ? "text-green-400"
      : value >= 60
      ? "text-yellow-400"
      : "text-red-400";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-base">{emoji}</span>
          <div>
            <p className="text-sm font-medium text-zinc-200">{label}</p>
            <p className="text-[11px] text-zinc-500">{description}</p>
          </div>
        </div>
        <motion.span
          initial={animated ? { opacity: 0 } : {}}
          animate={{ opacity: 1 }}
          transition={{ delay: delay + 0.3 }}
          className={cn("text-sm font-bold tabular-nums", textColor)}
        >
          {value}/100
        </motion.span>
      </div>

      {/* Bar track */}
      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className={cn("h-full rounded-full", color)}
          initial={animated ? { width: 0 } : { width: `${value}%` }}
          animate={{ width: `${value}%` }}
          transition={{
            duration: 0.8,
            delay,
            ease: "easeOut",
          }}
        />
      </div>
    </div>
  );
}

export default function ScoreBreakdown({
  starScore,
  animated = true,
}: ScoreBreakdownProps) {
  const keys: (keyof typeof STAR_LABELS)[] = [
    "situation",
    "task",
    "action",
    "result",
  ];

  const totalColor =
    starScore.total >= 80
      ? "text-green-400 border-green-500/30 bg-green-500/10"
      : starScore.total >= 60
      ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
      : "text-red-400 border-red-500/30 bg-red-500/10";

  return (
    <motion.div
      initial={animated ? { opacity: 0, y: 10 } : {}}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Total score */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          STAR Score
        </h3>
        <motion.div
          initial={animated ? { scale: 0 } : {}}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.5 }}
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full border font-bold text-sm",
            totalColor
          )}
        >
          <span>{starScore.total}</span>
          <span className="opacity-60 font-normal text-xs">/100</span>
        </motion.div>
      </div>

      {/* Individual bars */}
      <div className="space-y-4">
        {keys.map((key, i) => (
          <ScoreBar
            key={key}
            value={starScore[key]}
            label={STAR_LABELS[key].label}
            description={STAR_LABELS[key].description}
            emoji={STAR_LABELS[key].emoji}
            delay={animated ? i * 0.15 : 0}
            animated={animated}
          />
        ))}
      </div>
    </motion.div>
  );
}
