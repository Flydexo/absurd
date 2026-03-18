"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";

const LEVELS = [
  { value: 1, emoji: "😞", label: "Very Low" },
  { value: 3, emoji: "😕", label: "Low" },
  { value: 5, emoji: "😐", label: "Neutral" },
  { value: 7, emoji: "🙂", label: "Good" },
  { value: 9, emoji: "😄", label: "Very Good" },
];

const TAGS = [
  "Calm", "Anxious", "Happy", "Sad", "Energetic", "Tired",
  "Focused", "Overwhelmed", "Grateful", "Irritable", "Content", "Stressed",
];

export function StateOfMindPanel() {
  const { data: today, refetch } = trpc.dataPoints.todayStateOfMind.useQuery();

  const [selected, setSelected] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  const log = trpc.dataPoints.logStateOfMind.useMutation({
    onSuccess: () => {
      setSaved(true);
      refetch();
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const utils = trpc.useUtils();
  const handleLog = () => {
    if (selected === null) return;
    log.mutate(
      { value: selected, tags },
      { onSuccess: () => utils.dataPoints.dashboardSummary.invalidate() }
    );
  };

  const toggleTag = (t: string) =>
    setTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    );

  const todayValue = today?.value ?? null;
  const todayTags = today?.notes ?? null;

  return (
    <div
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "16px 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "14px",
        }}
      >
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            letterSpacing: "0.12em",
            color: "var(--text-muted)",
          }}
        >
          STATE OF MIND
        </span>
        {todayValue !== null && (
          <span style={{ fontSize: "10px", color: "#a855f7", letterSpacing: "0.06em" }}>
            TODAY: {todayValue}/10
            {todayTags && (
              <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>
                · {todayTags}
              </span>
            )}
          </span>
        )}
      </div>

      {/* Valence scale */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
        {LEVELS.map((l) => {
          const active = selected === l.value;
          return (
            <button
              key={l.value}
              onClick={() => setSelected(l.value)}
              title={l.label}
              style={{
                flex: 1,
                padding: "8px 4px",
                background: active ? "#a855f720" : "var(--surface)",
                border: `1px solid ${active ? "#a855f7" : "var(--border)"}`,
                cursor: "pointer",
                textAlign: "center",
                fontFamily: "IBM Plex Mono",
                fontSize: "20px",
                lineHeight: 1,
              }}
            >
              {l.emoji}
              <div
                style={{
                  fontSize: "9px",
                  color: active ? "#a855f7" : "var(--text-muted)",
                  marginTop: "4px",
                  letterSpacing: "0.06em",
                }}
              >
                {l.label.toUpperCase()}
              </div>
            </button>
          );
        })}
      </div>

      {/* Emotion tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px" }}>
        {TAGS.map((t) => {
          const on = tags.includes(t);
          return (
            <button
              key={t}
              onClick={() => toggleTag(t)}
              style={{
                padding: "3px 10px",
                background: on ? "#a855f720" : "transparent",
                border: `1px solid ${on ? "#a855f7" : "var(--border)"}`,
                color: on ? "#a855f7" : "var(--text-muted)",
                cursor: "pointer",
                fontFamily: "IBM Plex Mono",
                fontSize: "10px",
                letterSpacing: "0.06em",
              }}
            >
              {t.toUpperCase()}
            </button>
          );
        })}
      </div>

      {/* Log button */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <button
          onClick={handleLog}
          disabled={selected === null || log.isPending}
          style={{
            padding: "6px 18px",
            background: selected !== null ? "#a855f7" : "var(--surface)",
            color: selected !== null ? "#fff" : "var(--text-muted)",
            border: `1px solid ${selected !== null ? "#a855f7" : "var(--border)"}`,
            cursor: selected !== null ? "pointer" : "default",
            fontFamily: "IBM Plex Mono",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.08em",
            opacity: log.isPending ? 0.6 : 1,
          }}
        >
          {log.isPending ? "LOGGING…" : "LOG TODAY"}
        </button>
        {saved && (
          <span style={{ fontSize: "10px", color: "#a855f7" }}>
            ✓ LOGGED
          </span>
        )}
      </div>
    </div>
  );
}
