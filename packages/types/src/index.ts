// Metric definition
export interface Metric {
  id: string;
  userId: string;
  name: string;
  unit: string;
  color: string;
  description: string | null;
  createdAt: Date;
}

// A single time-series data point
export interface DataPoint {
  time: Date;
  metricId: string;
  userId: string;
  value: number;
  notes: string | null;
}

// Data point with metric info attached (for UI rendering)
export interface DataPointWithMetric extends DataPoint {
  metric: Metric;
}

// Aggregated metric view for dashboard tile
export interface MetricSummary {
  metric: Metric;
  latestValue: number | null;
  latestTime: Date | null;
  delta: number | null; // change vs previous period
  deltaPercent: number | null;
  history: { time: Date; value: number }[];
}

// North Star config
export interface NorthStarConfig {
  userId: string;
  metricId: string;
  updatedAt: Date;
}

// Invite
export interface Invite {
  id: string;
  email: string;
  createdBy: string;
  acceptedAt: Date | null;
  createdAt: Date;
}

// Correlation result between two metrics
export interface CorrelationResult {
  metricIdA: string;
  metricIdB: string;
  coefficient: number; // Pearson r, -1 to 1
  days: number;
  sampleSize: number;
}

// Time range options used in the UI
export type TimeRange = "7d" | "30d" | "90d" | "1y" | "all";
