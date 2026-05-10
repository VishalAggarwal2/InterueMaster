"use client";

import { motion } from "framer-motion";
import { TrendingDown, TrendingUp, Minus, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { WeakTopic } from "@/types";
import { formatRelative } from "@/lib/utils";
import { getColorByScore } from "@/lib/utils";

interface WeakTopicsProps {
  topics: WeakTopic[];
}

function TrendIcon({ trend }: { trend: WeakTopic["trend"] }) {
  switch (trend) {
    case "improving":
      return <TrendingUp size={12} className="text-green-400" />;
    case "declining":
      return <TrendingDown size={12} className="text-red-400" />;
    default:
      return <Minus size={12} className="text-zinc-500" />;
  }
}

export default function WeakTopics({ topics }: WeakTopicsProps) {
  if (topics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center mb-2">
          <span className="text-lg">🎉</span>
        </div>
        <p className="text-sm text-zinc-400">No weak topics identified yet</p>
        <p className="text-xs text-zinc-600 mt-1">
          Keep practicing to see insights
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {topics.map((topic, i) => (
        <motion.div
          key={topic.topic}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-zinc-800/50 transition-colors"
        >
          {/* Alert icon */}
          <div className="shrink-0">
            <AlertCircle
              size={14}
              style={{ color: getColorByScore(topic.avgScore) }}
            />
          </div>

          {/* Topic info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">
              {topic.topic}
            </p>
            <p className="text-xs text-zinc-600">
              Last: {formatRelative(topic.lastPracticed)}
            </p>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 shrink-0">
            <TrendIcon trend={topic.trend} />
            <Badge
              variant="outline"
              className="text-xs border-zinc-700 text-zinc-500"
            >
              {topic.frequency}x
            </Badge>
            <span
              className="text-xs font-bold tabular-nums"
              style={{ color: getColorByScore(topic.avgScore) }}
            >
              {topic.avgScore}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
