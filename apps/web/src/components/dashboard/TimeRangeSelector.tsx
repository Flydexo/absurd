"use client";

import type { TimeRange } from "@absurd/types";

const RANGES: TimeRange[] = ["7d", "30d", "90d", "1y"];

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function TimeRangeSelector({ value, onChange }: TimeRangeSelectorProps) {
  return (
    <div style={{ display: "flex", gap: "0", border: "1px solid var(--border)" }}>
      {RANGES.map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          style={{
            padding: "4px 12px",
            background: value === r ? "var(--accent)" : "var(--surface)",
            color: value === r ? "#000" : "var(--text-muted)",
            border: "none",
            borderRight:
              r !== RANGES[RANGES.length - 1]
                ? "1px solid var(--border)"
                : "none",
            cursor: "pointer",
            fontSize: "10px",
            fontFamily: "IBM Plex Mono",
            fontWeight: value === r ? 700 : 400,
            letterSpacing: "0.05em",
          }}
        >
          {r.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
