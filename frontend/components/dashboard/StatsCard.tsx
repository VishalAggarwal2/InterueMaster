"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: number;
  color?: "indigo" | "green" | "yellow" | "red" | "purple" | "orange";
  index?: number;
}

const colorMap = {
  indigo: {
    icon: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    value: "text-indigo-400",
  },
  green: {
    icon: "text-green-400",
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    value: "text-green-400",
  },
  yellow: {
    icon: "text-yellow-400",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/20",
    value: "text-yellow-400",
  },
  red: {
    icon: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    value: "text-red-400",
  },
  purple: {
    icon: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    value: "text-purple-400",
  },
  orange: {
    icon: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    value: "text-orange-400",
  },
};

export default function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = "indigo",
  index = 0,
}: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <Card className={cn("border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-colors")}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                {title}
              </p>
              <div className="flex items-baseline gap-1.5">
                <span className={cn("text-2xl font-bold tabular-nums", colors.value)}>
                  {value}
                </span>
              </div>
              {subtitle && (
                <p className="text-xs text-zinc-600 mt-1 truncate">{subtitle}</p>
              )}
              {trend !== undefined && (
                <p
                  className={cn(
                    "text-xs mt-1 font-medium",
                    trend > 0 ? "text-green-400" : trend < 0 ? "text-red-400" : "text-zinc-500"
                  )}
                >
                  {trend > 0 ? "↑" : trend < 0 ? "↓" : "→"}{" "}
                  {Math.abs(trend)}% vs last week
                </p>
              )}
            </div>
            <div className={cn("p-2.5 rounded-lg shrink-0", colors.bg)}>
              <Icon size={18} className={colors.icon} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
