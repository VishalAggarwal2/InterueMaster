"use client";

import { motion } from "framer-motion";
import { TopicHeatmapData } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { formatRelative } from "@/lib/utils";

interface TopicHeatmapProps {
  data: TopicHeatmapData[];
}

function getIntensityColor(avgScore: number, count: number): string {
  if (count === 0) return "bg-zinc-800/50";
  if (avgScore >= 80) return "bg-green-500/80";
  if (avgScore >= 70) return "bg-green-500/50";
  if (avgScore >= 60) return "bg-yellow-500/70";
  if (avgScore >= 50) return "bg-orange-500/60";
  return "bg-red-500/70";
}

export default function TopicHeatmap({ data }: TopicHeatmapProps) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <TooltipProvider>
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2">
        {data.map((topic, i) => {
          const intensity = topic.count / maxCount;
          const bgColor = getIntensityColor(topic.avgScore, topic.count);

          return (
            <Tooltip key={topic.topic}>
              <TooltipTrigger asChild>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.03 }}
                  className={`
                    relative rounded-lg p-2 text-center cursor-default
                    border border-zinc-800 hover:border-zinc-600
                    transition-all ${bgColor}
                  `}
                  style={{ opacity: topic.count === 0 ? 0.4 : 0.5 + intensity * 0.5 }}
                >
                  <p className="text-[10px] font-medium text-zinc-200 leading-tight truncate">
                    {topic.topic}
                  </p>
                  {topic.count > 0 && (
                    <p className="text-[11px] font-bold text-white mt-0.5">
                      {topic.avgScore}
                    </p>
                  )}
                </motion.div>
              </TooltipTrigger>
              <TooltipContent className="text-xs">
                <div className="space-y-0.5">
                  <p className="font-semibold">{topic.topic}</p>
                  {topic.count > 0 ? (
                    <>
                      <p>Avg score: {topic.avgScore}/100</p>
                      <p>Practiced: {topic.count}x</p>
                      <p>Last: {formatRelative(topic.lastPracticed)}</p>
                    </>
                  ) : (
                    <p className="text-zinc-500">Not practiced yet</p>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
