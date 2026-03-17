"use client";

import { trpc } from "@/lib/trpc/client";
import type { Metric } from "@absurd/types";

interface CorrelationTableProps {
  metrics: Metric[];
  northStarMetricId: string | null;
  days: number;
}

function corrColor(r: number | null): string {
  if (r === null) return "var(--text-dim)";
  const abs = Math.abs(r);
  if (abs >= 0.7)
    return r > 0 ? "var(--positive)" : "var(--negative)";
  if (abs >= 0.4)
    return r > 0 ? "#86efac" : "#fca5a5";
  return "var(--text-muted)";
}

function corrLabel(r: number | null): string {
  if (r === null) return "N/A";
  return r.toFixed(3);
}

interface CorrelationRowProps {
  northStarId: string;
  metric: Metric;
  days: number;
}

function CorrelationRow({ northStarId, metric, days }: CorrelationRowProps) {
  const { data, isLoading } = trpc.dataPoints.correlation.useQuery({
    metricIdA: northStarId,
    metricIdB: metric.id,
    days,
  });

  return (
    <tr
      style={{
        borderBottom: "1px solid var(--border)",
      }}
    >
      <td
        style={{
          padding: "6px 10px",
          color: "var(--text)",
          borderLeft: `2px solid ${metric.color}`,
        }}
      >
        {metric.name.toUpperCase()}
      </td>
      <td
        style={{
          padding: "6px 10px",
          textAlign: "right",
          color: corrColor(data?.coefficient ?? null),
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {isLoading ? "···" : corrLabel(data?.coefficient ?? null)}
      </td>
      <td
        style={{
          padding: "6px 10px",
          textAlign: "right",
          color: "var(--text-muted)",
          fontSize: "10px",
        }}
      >
        {isLoading ? "" : `n=${data?.sampleSize ?? 0}`}
      </td>
    </tr>
  );
}

export function CorrelationTable({
  metrics,
  northStarMetricId,
  days,
}: CorrelationTableProps) {
  const others = metrics.filter((m) => m.id !== northStarMetricId);

  if (!northStarMetricId || others.length === 0) return null;

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        background: "var(--surface)",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "8px 10px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span className="terminal-label">CORRELATION WITH NORTH STAR</span>
        <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
          PEARSON R · {days}D
        </span>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <th
              style={{
                padding: "5px 10px",
                textAlign: "left",
                fontSize: "10px",
                color: "var(--text-muted)",
                fontWeight: 400,
              }}
            >
              METRIC
            </th>
            <th
              style={{
                padding: "5px 10px",
                textAlign: "right",
                fontSize: "10px",
                color: "var(--text-muted)",
                fontWeight: 400,
              }}
            >
              R
            </th>
            <th
              style={{
                padding: "5px 10px",
                textAlign: "right",
                fontSize: "10px",
                color: "var(--text-muted)",
                fontWeight: 400,
              }}
            >
              SAMPLES
            </th>
          </tr>
        </thead>
        <tbody>
          {others.map((m) => (
            <CorrelationRow
              key={m.id}
              northStarId={northStarMetricId}
              metric={m}
              days={days}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
