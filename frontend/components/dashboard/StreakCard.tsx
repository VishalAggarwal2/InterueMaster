"use client";

import { motion } from "framer-motion";
import { Flame, Trophy, Target } from "lucide-react";

interface StreakCardProps {
  streak: number;
  longestStreak?: number;
  nextMilestone?: number;
}

export default function StreakCard({
  streak,
  longestStreak = 0,
  nextMilestone,
}: StreakCardProps) {
  const milestone = nextMilestone || Math.ceil((streak + 1) / 7) * 7;
  const progress = (streak % milestone) / milestone;

  const flameColor =
    streak >= 30
      ? "text-red-400"
      : streak >= 14
      ? "text-orange-400"
      : streak >= 7
      ? "text-yellow-400"
      : "text-orange-300";

  const bgColor =
    streak >= 30
      ? "from-red-500/20 to-orange-500/10"
      : streak >= 14
      ? "from-orange-500/20 to-yellow-500/10"
      : "from-yellow-500/20 to-orange-500/10";

  return (
    <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br ${bgColor} border border-orange-500/20 p-4`}>
      {/* Background decoration */}
      <div className="absolute top-0 right-0 opacity-5">
        <Flame size={80} className="text-orange-400 translate-x-4 -translate-y-4" />
      </div>

      <div className="relative">
        {/* Main streak display */}
        <div className="flex items-center gap-3 mb-3">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Flame size={28} className={flameColor} />
          </motion.div>

          <div>
            <div className="flex items-baseline gap-1">
              <motion.span
                key={streak}
                initial={{ scale: 1.3, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-3xl font-bold text-zinc-100"
              >
                {streak}
              </motion.span>
              <span className="text-sm text-zinc-400">day streak</span>
            </div>
          </div>
        </div>

        {/* Progress to next milestone */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-xs text-zinc-500">
            <span>Next milestone: {milestone} days</span>
            <span>{streak}/{milestone}</span>
          </div>
          <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(progress * 100, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Trophy size={12} className="text-yellow-500" />
            <span className="text-xs text-zinc-400">
              Best: <span className="text-zinc-200 font-medium">{longestStreak}d</span>
            </span>
          </div>

          {streak === 0 && (
            <div className="flex items-center gap-1.5">
              <Target size={12} className="text-indigo-400" />
              <span className="text-xs text-zinc-400">Practice today!</span>
            </div>
          )}

          {streak > 0 && streak === longestStreak && (
            <span className="text-xs text-yellow-400 font-medium">
              🏆 Personal best!
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
