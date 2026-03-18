"use client";

import { useState, useCallback } from "react";
import { trpc } from "@/lib/trpc/client";

// Supported Apple Health record types
const AH_TYPES: Record<
  string,
  { label: string; unit: string; agg: "avg" | "sum" | "sleep" }
> = {
  HKQuantityTypeIdentifierBodyMass: {
    label: "Body Mass",
    unit: "kg",
    agg: "avg",
  },
  HKQuantityTypeIdentifierStepCount: {
    label: "Steps",
    unit: "count",
    agg: "sum",
  },
  HKQuantityTypeIdentifierHeartRate: {
    label: "Heart Rate",
    unit: "bpm",
    agg: "avg",
  },
  HKQuantityTypeIdentifierRestingHeartRate: {
    label: "Resting Heart Rate",
    unit: "bpm",
    agg: "avg",
  },
  HKQuantityTypeIdentifierActiveEnergyBurned: {
    label: "Active Calories",
    unit: "kcal",
    agg: "sum",
  },
  HKQuantityTypeIdentifierDistanceWalkingRunning: {
    label: "Walking + Running Distance",
    unit: "km",
    agg: "sum",
  },
  HKQuantityTypeIdentifierAppleExerciseTime: {
    label: "Exercise Time",
    unit: "min",
    agg: "sum",
  },
  HKCategoryTypeIdentifierSleepAnalysis: {
    label: "Sleep",
    unit: "hrs",
    agg: "sleep",
  },
  HKStateOfMind: {
    label: "State of Mind",
    unit: "/10",
    agg: "avg",
  },
};

type DayAgg = { sum: number; count: number; sleepHours: number };
type ParsedData = {
  data: Record<string, Record<string, DayAgg>>;
  rawCounts: Record<string, number>;
};

function getAttr(line: string, name: string): string | null {
  const m = line.match(new RegExp(`${name}="([^"]*)"`));
  return m ? m[1] : null;
}

async function parseFile(
  file: File,
  onProgress: (pct: number) => void
): Promise<ParsedData> {
  const CHUNK = 512 * 1024; // 512 KB
  const data: Record<string, Record<string, DayAgg>> = {};
  const rawCounts: Record<string, number> = {};
  let offset = 0;
  let leftover = "";

  while (offset < file.size) {
    const text = leftover + (await file.slice(offset, offset + CHUNK).text());
    offset += CHUNK;

    const lastNL = text.lastIndexOf("\n");
    leftover = lastNL === -1 ? text : text.slice(lastNL + 1);
    const lines = (lastNL === -1 ? "" : text.slice(0, lastNL + 1)).split("\n");

    for (const line of lines) {
      if (!line.includes("<Record ") && !line.includes('type="HKStateOfMind"'))
        continue;
      if (!line.includes("type=")) continue;
      const type = getAttr(line, "type");
      if (!type || !AH_TYPES[type]) continue;

      rawCounts[type] = (rawCounts[type] ?? 0) + 1;

      const startDateStr = getAttr(line, "startDate");
      if (!startDateStr) continue;
      const day = startDateStr.slice(0, 10);

      if (!data[type]) data[type] = {};
      if (!data[type][day]) data[type][day] = { sum: 0, count: 0, sleepHours: 0 };

      const meta = AH_TYPES[type];

      if (meta.agg === "sleep") {
        const endDateStr = getAttr(line, "endDate");
        const value = getAttr(line, "value");
        if (
          !endDateStr ||
          (!value?.includes("Asleep") &&
            value !== "HKCategoryValueSleepAnalysisAsleepUnspecified")
        )
          continue;
        const start = new Date(startDateStr.slice(0, 19).replace(" ", "T"));
        const end = new Date(endDateStr.slice(0, 19).replace(" ", "T"));
        const hrs = (end.getTime() - start.getTime()) / 3_600_000;
        if (hrs <= 0 || hrs > 24) continue;
        // Attribute sleep to the day it ends (morning)
        const sleepDay = endDateStr.slice(0, 10);
        if (!data[type][sleepDay])
          data[type][sleepDay] = { sum: 0, count: 0, sleepHours: 0 };
        data[type][sleepDay].sleepHours += hrs;
      } else if (type === "HKStateOfMind") {
        // valence is -1..1; convert to 1..10 scale
        const valenceStr = getAttr(line, "valence");
        if (!valenceStr) continue;
        const valence = parseFloat(valenceStr);
        if (isNaN(valence)) continue;
        const v = parseFloat((((valence + 1) / 2) * 9 + 1).toFixed(1));
        data[type][day].sum += v;
        data[type][day].count += 1;
      } else {
        const valueStr = getAttr(line, "value");
        if (!valueStr) continue;
        let v = parseFloat(valueStr);
        if (isNaN(v)) continue;

        // Unit conversions
        if (type === "HKQuantityTypeIdentifierBodyMass") {
          const unit = getAttr(line, "unit");
          if (unit === "lb") v *= 0.453592;
        }
        if (type === "HKQuantityTypeIdentifierDistanceWalkingRunning") {
          const unit = getAttr(line, "unit");
          if (unit === "mi") v *= 1.60934;
        }

        data[type][day].sum += v;
        data[type][day].count += 1;
      }
    }

    onProgress(Math.min(99, Math.round((offset / file.size) * 100)));
    await new Promise((r) => setTimeout(r, 0)); // yield to event loop
  }

  return { data, rawCounts };
}

function aggregateDay(agg: DayAgg, type: "avg" | "sum" | "sleep"): number {
  if (type === "sleep") return parseFloat(agg.sleepHours.toFixed(2));
  if (type === "sum") return parseFloat(agg.sum.toFixed(2));
  return agg.count > 0 ? parseFloat((agg.sum / agg.count).toFixed(2)) : 0;
}

const BTN: React.CSSProperties = {
  padding: "7px 16px",
  background: "var(--accent)",
  color: "#000",
  border: "none",
  cursor: "pointer",
  fontFamily: "IBM Plex Mono",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.05em",
};

const SELECT_STYLE: React.CSSProperties = {
  padding: "4px 8px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  fontFamily: "IBM Plex Mono",
  fontSize: "11px",
  outline: "none",
  minWidth: "160px",
};

export function AppleHealthImport({
  userMetrics,
}: {
  userMetrics: { id: string; name: string; unit: string }[];
}) {
  const [parseProgress, setParseProgress] = useState<number | null>(null);
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({}); // ahType -> metricId
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const bulkInsert = trpc.dataPoints.bulkInsert.useMutation();

  const handleFile = useCallback(async (file: File) => {
    setResult(null);
    setError(null);
    setParsed(null);
    setParseProgress(0);
    setMapping({});
    try {
      const result = await parseFile(file, setParseProgress);
      setParsed(result);
      setParseProgress(null);
    } catch (e) {
      setError(String(e));
      setParseProgress(null);
    }
  }, []);

  const detectedTypes = parsed
    ? Object.keys(parsed.rawCounts).filter((t) => AH_TYPES[t])
    : [];

  const totalDays = parsed
    ? detectedTypes.reduce((acc, t) => {
        const mapped = mapping[t];
        if (!mapped) return acc;
        return acc + Object.keys(parsed.data[t] ?? {}).length;
      }, 0)
    : 0;

  async function handleImport() {
    if (!parsed) return;
    setImporting(true);
    setResult(null);
    setError(null);

    const BATCH = 1500;
    let totalInserted = 0;

    try {
      const points: { metricId: string; time: Date; value: number }[] = [];

      for (const [ahType, metricId] of Object.entries(mapping)) {
        if (!metricId || !parsed.data[ahType]) continue;
        const meta = AH_TYPES[ahType];
        for (const [day, agg] of Object.entries(parsed.data[ahType])) {
          const value = aggregateDay(agg, meta.agg);
          if (value <= 0) continue;
          const date = new Date(day + "T12:00:00.000Z");
          points.push({ metricId, time: date, value });
        }
      }

      for (let i = 0; i < points.length; i += BATCH) {
        const res = await bulkInsert.mutateAsync({
          points: points.slice(i, i + BATCH),
        });
        totalInserted += res.inserted;
      }

      await utils.dataPoints.dashboardSummary.invalidate();
      setResult(`Imported ${totalInserted} data points.`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <p
        style={{
          fontSize: "11px",
          color: "var(--text-muted)",
          marginBottom: "12px",
        }}
      >
        Export your data from the Health app (Profile → Export All Health Data),
        then upload the <code>export.xml</code> file. Parsing runs entirely in
        your browser — the file is never uploaded raw.
      </p>

      {/* File picker */}
      <label
        style={{
          display: "inline-block",
          padding: "7px 16px",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          color: "var(--text)",
          cursor: "pointer",
          fontFamily: "IBM Plex Mono",
          fontSize: "11px",
          letterSpacing: "0.05em",
        }}
      >
        {parseProgress !== null
          ? `PARSING… ${parseProgress}%`
          : "SELECT export.xml"}
        <input
          type="file"
          accept=".xml"
          style={{ display: "none" }}
          disabled={parseProgress !== null || importing}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </label>

      {/* Mapping table */}
      {parsed && detectedTypes.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <div
            style={{
              fontSize: "10px",
              color: "var(--text-muted)",
              marginBottom: "8px",
              letterSpacing: "0.08em",
            }}
          >
            MAP APPLE HEALTH DATA → YOUR METRICS
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["HEALTH TYPE", "DAYS", "UNIT", "→ METRIC"].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "4px 8px",
                      textAlign: "left",
                      fontSize: "10px",
                      color: "var(--text-muted)",
                      fontWeight: 400,
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detectedTypes.map((ahType) => {
                const meta = AH_TYPES[ahType];
                const days = Object.keys(parsed.data[ahType] ?? {}).length;
                return (
                  <tr
                    key={ahType}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <td
                      style={{
                        padding: "6px 8px",
                        fontSize: "11px",
                        color: "var(--text)",
                      }}
                    >
                      {meta.label}
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                      }}
                    >
                      {days}
                    </td>
                    <td
                      style={{
                        padding: "6px 8px",
                        fontSize: "11px",
                        color: "var(--text-muted)",
                      }}
                    >
                      {meta.unit}
                    </td>
                    <td style={{ padding: "6px 8px" }}>
                      <select
                        style={SELECT_STYLE}
                        value={mapping[ahType] ?? ""}
                        onChange={(e) =>
                          setMapping((prev) => ({
                            ...prev,
                            [ahType]: e.target.value,
                          }))
                        }
                      >
                        <option value="">— skip —</option>
                        {userMetrics.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name} ({m.unit || "—"})
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div
            style={{
              marginTop: "16px",
              display: "flex",
              gap: "12px",
              alignItems: "center",
            }}
          >
            <button
              onClick={handleImport}
              disabled={importing || totalDays === 0}
              style={{
                ...BTN,
                opacity: importing || totalDays === 0 ? 0.5 : 1,
              }}
            >
              {importing
                ? "IMPORTING…"
                : `IMPORT ${totalDays} DATA POINT${totalDays !== 1 ? "S" : ""}`}
            </button>
            {totalDays === 0 && (
              <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                Map at least one type to a metric.
              </span>
            )}
          </div>
        </div>
      )}

      {parsed && detectedTypes.length === 0 && (
        <p
          style={{
            fontSize: "11px",
            color: "var(--text-muted)",
            marginTop: "12px",
          }}
        >
          No supported health types found in this file.
        </p>
      )}

      {result && (
        <p
          style={{
            fontSize: "11px",
            color: "var(--positive)",
            marginTop: "8px",
          }}
        >
          {result}
        </p>
      )}
      {error && (
        <p
          style={{
            fontSize: "11px",
            color: "var(--negative)",
            marginTop: "8px",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
