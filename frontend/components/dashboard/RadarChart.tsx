"use client";

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { RadarData } from "@/types";

interface RadarChartProps {
  data: RadarData[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: RadarData }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;
  const { value, payload: data } = payload[0];

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 shadow-xl">
      <p className="text-xs text-zinc-400">{data.category}</p>
      <p className="text-sm font-bold text-indigo-400">{value}/100</p>
    </div>
  );
}

export default function RadarChart({ data }: RadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <RechartsRadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
        <PolarGrid stroke="#3f3f46" gridType="polygon" />
        <PolarAngleAxis
          dataKey="category"
          tick={{ fontSize: 11, fill: "#71717a" }}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Radar
          name="Score"
          dataKey="score"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.25}
          strokeWidth={2}
          dot={{ fill: "#6366f1", r: 3 }}
        />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
