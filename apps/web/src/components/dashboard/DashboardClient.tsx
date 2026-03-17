"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { NorthStarPanel } from "./NorthStarPanel";
import { MetricGrid } from "./MetricGrid";
import { CorrelationTable } from "./CorrelationTable";
import { TimeRangeSelector } from "./TimeRangeSelector";
import { getTimeRangeDays } from "@/lib/utils";
import type { TimeRange } from "@absurd/types";

export function DashboardClient() {
  const [range, setRange] = useState<TimeRange>("30d");
  const days = getTimeRangeDays(range);

  const { data: northStar } = trpc.northStar.get.useQuery();
  const { data: summaries, isLoading } = trpc.dataPoints.dashboardSummary.useQuery(
    { days },
    { refetchInterval: 60_000 }
  );

  const northStarSummary = summaries?.find(
    (s) => s.metric.id === northStar?.metricId
  );

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      {/* Status bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "8px 24px",
          borderBottom: "1px solid var(--border)",
          background: "var(--surface)",
        }}
      >
        <div style={{ display: "flex", gap: "24px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            METRICS:{" "}
            <span style={{ color: "var(--text)" }}>{summaries?.length ?? "—"}</span>
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            RANGE:{" "}
            <span style={{ color: "var(--accent)" }}>{range.toUpperCase()}</span>
          </span>
        </div>
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>

      {isLoading ? (
        <div
          style={{
            padding: "60px 24px",
            textAlign: "center",
            color: "var(--text-muted)",
            fontSize: "12px",
            letterSpacing: "0.1em",
          }}
        >
          LOADING DATA...
        </div>
      ) : (
        <>
          {/* North Star panel */}
          {northStarSummary ? (
            <NorthStarPanel summary={northStarSummary} />
          ) : (
            <div
              style={{
                padding: "40px 24px",
                borderBottom: "1px solid var(--border)",
                color: "var(--text-muted)",
                fontSize: "12px",
                textAlign: "center",
              }}
            >
              NO NORTH STAR SET —{" "}
              <a
                href="/settings"
                style={{ color: "var(--accent)", textDecoration: "none" }}
              >
                CONFIGURE IN SETTINGS
              </a>
            </div>
          )}

          {/* Metrics grid */}
          <div style={{ padding: "1px 0" }}>
            <MetricGrid
              summaries={summaries ?? []}
              northStarMetricId={northStar?.metricId ?? null}
            />
          </div>

          {/* Correlation table */}
          {summaries && summaries.length > 1 && (
            <div style={{ padding: "24px", paddingTop: "16px" }}>
              <CorrelationTable
                metrics={summaries.map((s) => s.metric)}
                northStarMetricId={northStar?.metricId ?? null}
                days={days}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
