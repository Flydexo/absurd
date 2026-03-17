"use client";

import { MetricChart } from "./MetricChart";
import { formatValue, formatDelta } from "@/lib/utils";
import type { MetricSummary } from "@absurd/types";

interface MetricTileProps {
  summary: MetricSummary;
  isNorthStar?: boolean;
}

export function MetricTile({ summary, isNorthStar }: MetricTileProps) {
  const { metric, latestValue, latestTime, delta, history } = summary;
  const { text: deltaText, cls: deltaCls } = formatDelta(delta, metric.unit);

  const timeStr = latestTime
    ? new Date(latestTime).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <div
      className="terminal-tile"
      style={{
        borderLeft: `2px solid ${metric.color}`,
        cursor: "default",
        position: "relative",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "8px",
        }}
      >
        <div>
          <span className="terminal-label">{metric.name.toUpperCase()}</span>
          {metric.unit && (
            <span
              style={{
                fontSize: "9px",
                color: "var(--text-dim)",
                marginLeft: "4px",
              }}
            >
              [{metric.unit}]
            </span>
          )}
        </div>
        {isNorthStar && (
          <span style={{ fontSize: "10px", color: "var(--accent)" }}>★</span>
        )}
      </div>

      {/* Value */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "8px",
          marginBottom: "10px",
        }}
      >
        <span className="terminal-value-sm">
          {latestValue !== null ? formatValue(latestValue, metric.unit) : "—"}
        </span>
        <span className={deltaCls} style={{ fontSize: "11px" }}>
          {deltaText}
        </span>
      </div>

      {/* Mini sparkline */}
      {history.length > 1 && (
        <MetricChart data={history} color={metric.color} unit={metric.unit} mini />
      )}

      {/* Timestamp */}
      <div style={{ marginTop: "6px" }}>
        <span style={{ fontSize: "9px", color: "var(--text-dim)" }}>
          {timeStr}
        </span>
      </div>
    </div>
  );
}
