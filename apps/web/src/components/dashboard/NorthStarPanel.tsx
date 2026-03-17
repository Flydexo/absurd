"use client";

import { MetricChart } from "./MetricChart";
import { formatValue, formatDelta } from "@/lib/utils";
import type { MetricSummary } from "@absurd/types";

interface NorthStarPanelProps {
  summary: MetricSummary;
}

export function NorthStarPanel({ summary }: NorthStarPanelProps) {
  const { metric, latestValue, latestTime, delta, history } = summary;
  const { text: deltaText, cls: deltaCls } = formatDelta(delta, metric.unit);

  const dayStr = latestTime
    ? new Date(latestTime).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "—";

  return (
    <div
      style={{
        borderBottom: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "20px 24px",
      }}
    >
      {/* Header row */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "12px",
          marginBottom: "12px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--accent)",
          }}
        >
          ★ NORTH STAR
        </span>
        <span
          style={{
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          {metric.name.toUpperCase()}
        </span>
        {metric.unit && (
          <span
            style={{
              fontSize: "10px",
              color: "var(--text-dim)",
              letterSpacing: "0.05em",
            }}
          >
            [{metric.unit}]
          </span>
        )}
      </div>

      {/* Value row */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "24px",
          marginBottom: "16px",
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: "52px",
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            color: "var(--text)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {latestValue !== null ? formatValue(latestValue, metric.unit) : "—"}
        </span>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "2px",
            paddingBottom: "4px",
          }}
        >
          <span
            className={deltaCls}
            style={{ fontSize: "16px", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
          >
            {delta !== null && delta > 0 ? "▲" : delta !== null && delta < 0 ? "▼" : ""}
            {" "}{deltaText}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            vs prev day
          </span>
        </div>

        <div style={{ paddingBottom: "4px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {dayStr}
          </span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ marginTop: "4px" }}>
        <MetricChart data={history} color={metric.color} unit={metric.unit} />
      </div>
    </div>
  );
}
