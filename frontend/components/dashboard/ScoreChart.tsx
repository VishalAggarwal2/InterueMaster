"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { ScoreHistory } from "@/types";
import { format, parseISO } from "date-fns";
import { getColorByScore } from "@/lib/utils";

interface ScoreChartProps {
  data: ScoreHistory[];
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; payload: ScoreHistory }>;
  label?: string;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload || !payload.length) return null;

  const { value, payload: data } = payload[0];

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 shadow-xl">
      <p className="text-xs text-zinc-500 mb-1">
        {data.role}
        {data.company ? ` @ ${data.company}` : ""}
      </p>
      <p className="text-lg font-bold" style={{ color: getColorByScore(value) }}>
        {value}
        <span className="text-xs font-normal text-zinc-500 ml-1">/100</span>
      </p>
      <p className="text-xs text-zinc-600 mt-0.5">
        {format(parseISO(data.date), "MMM d, yyyy")}
      </p>
    </div>
  );
}

export default function ScoreChart({ data }: ScoreChartProps) {
  const avgScore =
    data.length > 0
      ? Math.round(data.reduce((s, d) => s + d.score, 0) / data.length)
      : 0;

  const chartData = data.map((d) => ({
    ...d,
    date: format(parseISO(d.date), "MMM d"),
  }));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>Last {data.length} sessions</span>
        <span>
          Avg:{" "}
          <span
            className="font-semibold"
            style={{ color: getColorByScore(avgScore) }}
          >
            {avgScore}
          </span>
        </span>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#27272a"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "#71717a" }}
            tickLine={false}
            axisLine={false}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine
            y={avgScore}
            stroke="#6366f1"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{
              fill: "#6366f1",
              r: 3,
              strokeWidth: 0,
            }}
            activeDot={{
              fill: "#8b5cf6",
              r: 5,
              strokeWidth: 0,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
