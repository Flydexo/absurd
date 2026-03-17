"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from "recharts";

interface ChartPoint {
  time: Date;
  value: number;
}

interface MetricChartProps {
  data: ChartPoint[];
  color: string;
  unit: string;
  mini?: boolean;
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function MetricChart({ data, color, unit, mini = false }: MetricChartProps) {
  const chartData = data.map((p) => ({
    t: new Date(p.time).getTime(),
    v: p.value,
  }));

  if (mini) {
    return (
      <ResponsiveContainer width="100%" height={40}>
        <LineChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="t"
          type="number"
          scale="time"
          domain={["dataMin", "dataMax"]}
          tickFormatter={(v) => formatDate(new Date(v))}
          tick={{
            fill: "var(--text-muted)",
            fontSize: 10,
            fontFamily: "IBM Plex Mono",
          }}
          tickLine={false}
          axisLine={{ stroke: "var(--border)" }}
          minTickGap={40}
        />
        <YAxis
          tick={{
            fill: "var(--text-muted)",
            fontSize: 10,
            fontFamily: "IBM Plex Mono",
          }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `${v}${unit}`}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: "var(--surface-2)",
            border: "1px solid var(--border-bright)",
            borderRadius: 0,
            fontFamily: "IBM Plex Mono",
            fontSize: 11,
            color: "var(--text)",
            padding: "6px 10px",
          }}
          labelFormatter={(v) => formatDate(new Date(v))}
          formatter={(v: number) => [`${v}${unit ? " " + unit : ""}`, ""]}
          cursor={{ stroke: "var(--border-bright)", strokeWidth: 1 }}
        />
        <Line
          type="monotone"
          dataKey="v"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
          activeDot={{ r: 3, fill: color, stroke: "var(--bg)" }}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
