"use client";

import { useMemo } from "react";
import { format, parseISO, eachDayOfInterval, subDays, startOfWeek } from "date-fns";
import { HeatmapData } from "@/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ActivityHeatmapProps {
  data: HeatmapData[];
}

const WEEKS = 52;
const DAYS_IN_WEEK = 7;
const CELL_SIZE = 12;
const CELL_GAP = 2;

function getColor(count: number, score: number): string {
  if (count === 0) return "#18181b";
  if (score >= 80) return count >= 3 ? "#16a34a" : count >= 2 ? "#22c55e" : "#4ade80";
  if (score >= 60) return count >= 3 ? "#ca8a04" : count >= 2 ? "#eab308" : "#facc15";
  return count >= 3 ? "#dc2626" : count >= 2 ? "#ef4444" : "#f87171";
}

export default function ActivityHeatmap({ data }: ActivityHeatmapProps) {
  const today = new Date();
  const startDate = subDays(today, WEEKS * DAYS_IN_WEEK - 1);

  // Build a lookup map
  const dataMap = useMemo(() => {
    const map = new Map<string, HeatmapData>();
    data.forEach((d) => {
      map.set(d.date.split("T")[0], d);
    });
    return map;
  }, [data]);

  // Build grid: columns are weeks, rows are days (Mon-Sun)
  const weeks = useMemo(() => {
    const days = eachDayOfInterval({ start: startDate, end: today });
    const result: Array<Array<{ date: Date; data: HeatmapData | null }>> = [];
    let currentWeek: Array<{ date: Date; data: HeatmapData | null }> = [];

    // Pad first week
    const firstDayOfWeek = days[0].getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({ date: new Date(0), data: null });
    }

    days.forEach((day: Date) => {
      const key = format(day, "yyyy-MM-dd");
      const dayData = dataMap.get(key) || null;
      currentWeek.push({ date: day, data: dayData });

      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
    });

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: new Date(0), data: null });
      }
      result.push(currentWeek);
    }

    return result;
  }, [dataMap, startDate, today]);

  const totalSessions = data.reduce((s, d) => s + d.count, 0);
  const activeDays = data.filter((d) => d.count > 0).length;

  const monthLabels = useMemo(() => {
    const labels: { label: string; weekIndex: number }[] = [];
    weeks.forEach((week, i) => {
      const firstValid = week.find((d) => d.date.getTime() !== 0);
      if (firstValid && firstValid.date.getDate() <= 7) {
        labels.push({
          label: format(firstValid.date, "MMM"),
          weekIndex: i,
        });
      }
    });
    return labels;
  }, [weeks]);

  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <TooltipProvider>
      <div className="space-y-2">
        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span>
            <span className="text-zinc-300 font-medium">{totalSessions}</span> sessions
          </span>
          <span>
            <span className="text-zinc-300 font-medium">{activeDays}</span> active days
          </span>
          <span>in the last year</span>
        </div>

        {/* Grid */}
        <div className="overflow-x-auto">
          <div className="inline-flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1 mt-5">
              {dayLabels.map((day, i) => (
                <div
                  key={day}
                  className="text-[10px] text-zinc-700 flex items-center"
                  style={{ height: CELL_SIZE, lineHeight: `${CELL_SIZE}px` }}
                >
                  {i % 2 === 1 ? day.slice(0, 1) : ""}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div>
              {/* Month labels */}
              <div className="flex gap-0.5 mb-1">
                {weeks.map((_, i) => {
                  const monthLabel = monthLabels.find((m) => m.weekIndex === i);
                  return (
                    <div
                      key={i}
                      style={{ width: CELL_SIZE }}
                      className="text-[10px] text-zinc-600 truncate"
                    >
                      {monthLabel?.label || ""}
                    </div>
                  );
                })}
              </div>

              {/* Cells */}
              <div className="flex gap-0.5">
                {weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-col gap-0.5">
                    {week.map((day, di) => {
                      const isEmpty = day.date.getTime() === 0;
                      const count = day.data?.count || 0;
                      const score = day.data?.score || 0;
                      const color = isEmpty ? "transparent" : getColor(count, score);

                      if (isEmpty) {
                        return (
                          <div
                            key={di}
                            style={{ width: CELL_SIZE, height: CELL_SIZE }}
                          />
                        );
                      }

                      return (
                        <Tooltip key={di}>
                          <TooltipTrigger asChild>
                            <div
                              style={{
                                width: CELL_SIZE,
                                height: CELL_SIZE,
                                backgroundColor: color,
                                borderRadius: 2,
                              }}
                              className="cursor-default transition-opacity hover:opacity-80"
                            />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {count > 0 ? (
                              <span>
                                {format(day.date, "MMM d, yyyy")} — {count} session
                                {count > 1 ? "s" : ""}, avg score {score}
                              </span>
                            ) : (
                              <span>{format(day.date, "MMM d, yyyy")} — No sessions</span>
                            )}
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-600">
          <span>Less</span>
          {["#18181b", "#4ade80", "#22c55e", "#16a34a"].map((c) => (
            <div
              key={c}
              style={{ backgroundColor: c, width: 10, height: 10, borderRadius: 2 }}
            />
          ))}
          <span>More</span>
        </div>
      </div>
    </TooltipProvider>
  );
}
