"use client";

import { MetricTile } from "./MetricTile";
import type { MetricSummary } from "@absurd/types";

interface MetricGridProps {
  summaries: MetricSummary[];
  northStarMetricId: string | null;
}

export function MetricGrid({ summaries, northStarMetricId }: MetricGridProps) {
  // Filter out the North Star metric — it's shown in the panel above
  const rest = summaries.filter((s) => s.metric.id !== northStarMetricId);

  if (rest.length === 0) {
    return (
      <div
        style={{
          padding: "40px 24px",
          textAlign: "center",
          color: "var(--text-muted)",
          fontSize: "12px",
        }}
      >
        NO OTHER METRICS — ADD METRICS IN SETTINGS
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
        gap: "1px",
        background: "var(--border)",
        border: "1px solid var(--border)",
      }}
    >
      {rest.map((summary) => (
        <MetricTile
          key={summary.metric.id}
          summary={summary}
          isNorthStar={summary.metric.id === northStarMetricId}
        />
      ))}
    </div>
  );
}
