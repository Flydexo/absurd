import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatValue(value: number, unit: string): string {
  if (unit === "$") {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  if (unit === "/10") {
    return value.toFixed(1);
  }
  return `${value.toFixed(1)}${unit ? " " + unit : ""}`;
}

export function formatDelta(
  delta: number | null,
  unit: string
): { text: string; cls: string } {
  if (delta === null)
    return { text: "—", cls: "delta-neutral" };
  const sign = delta > 0 ? "+" : "";
  const formatted =
    unit === "$"
      ? `${sign}$${Math.abs(delta).toFixed(0)}`
      : `${sign}${delta.toFixed(1)}`;
  const cls =
    delta > 0 ? "delta-positive" : delta < 0 ? "delta-negative" : "delta-neutral";
  return { text: formatted, cls };
}

export function getTimeRangeDays(range: string): number {
  switch (range) {
    case "7d":
      return 7;
    case "30d":
      return 30;
    case "90d":
      return 90;
    case "1y":
      return 365;
    default:
      return 90;
  }
}
