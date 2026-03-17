import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { users, metrics, dataPoints, northStarConfig } from "./schema";
import { eq } from "drizzle-orm";

const connectionString = process.env.POSTGRES_URL!;
const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

// Seeded user for development
const SEED_USER_ID = "seed-user-001";
const SEED_USER_EMAIL = "dev@absurd.local";

function randomNoise(base: number, spread: number): number {
  return base + (Math.random() - 0.5) * spread * 2;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

console.log("Seeding database...");

// Clean up existing seed data
await db.delete(dataPoints).where(eq(dataPoints.userId, SEED_USER_ID));
await db.delete(northStarConfig).where(eq(northStarConfig.userId, SEED_USER_ID));
await db.delete(metrics).where(eq(metrics.userId, SEED_USER_ID));
await db.delete(users).where(eq(users.id, SEED_USER_ID));

// Create seed user
await db.insert(users).values({
  id: SEED_USER_ID,
  name: "Dev User",
  email: SEED_USER_EMAIL,
  image: null,
  githubUsername: "devuser",
});

// Define metrics
const metricDefs = [
  {
    id: "metric-mood",
    name: "Mood",
    unit: "/10",
    color: "#f59e0b",
    description: "Daily mood score from 1 to 10",
  },
  {
    id: "metric-sleep",
    name: "Sleep",
    unit: "hrs",
    color: "#6366f1",
    description: "Hours of sleep",
  },
  {
    id: "metric-weight",
    name: "Weight",
    unit: "kg",
    color: "#22c55e",
    description: "Body weight in kilograms",
  },
  {
    id: "metric-revenue",
    name: "Revenue",
    unit: "$",
    color: "#ec4899",
    description: "Daily revenue in USD",
  },
  {
    id: "metric-focus",
    name: "Focus",
    unit: "hrs",
    color: "#14b8a6",
    description: "Deep focus / flow hours",
  },
];

await db.insert(metrics).values(
  metricDefs.map((m) => ({ ...m, userId: SEED_USER_ID }))
);

// Set North Star to Mood
await db.insert(northStarConfig).values({
  userId: SEED_USER_ID,
  metricId: "metric-mood",
});

// Generate 90 days of data
const points: (typeof dataPoints.$inferInsert)[] = [];
const now = new Date();

// Base values and trends
let mood = 6.5;
let sleep = 7.2;
let weight = 78.0;
let revenue = 150;
let focus = 4.5;

for (let d = 89; d >= 0; d--) {
  const date = new Date(now);
  date.setDate(date.getDate() - d);
  date.setHours(9, 0, 0, 0);

  // Sleep affects mood (positive correlation)
  const sleepDelta = (Math.random() - 0.5) * 1.5;
  sleep = clamp(sleep + sleepDelta, 4, 10);
  const sleepEffect = (sleep - 7) * 0.3;

  mood = clamp(mood + sleepEffect + (Math.random() - 0.5) * 1.2, 1, 10);
  weight = clamp(weight + (Math.random() - 0.52) * 0.3, 70, 85); // slow downtrend
  revenue = clamp(
    revenue + (Math.random() - 0.45) * 40 + (d < 30 ? 2 : 0),
    0,
    800
  ); // uptick recent 30d
  focus = clamp(focus + (mood - 6) * 0.15 + (Math.random() - 0.5) * 1, 0, 10);

  // Weekends have lower focus/revenue
  const dow = date.getDay();
  const isWeekend = dow === 0 || dow === 6;

  points.push(
    {
      time: date,
      metricId: "metric-mood",
      userId: SEED_USER_ID,
      value: parseFloat(mood.toFixed(1)),
    },
    {
      time: date,
      metricId: "metric-sleep",
      userId: SEED_USER_ID,
      value: parseFloat(sleep.toFixed(1)),
    },
    {
      time: date,
      metricId: "metric-weight",
      userId: SEED_USER_ID,
      value: parseFloat(weight.toFixed(1)),
    },
    {
      time: date,
      metricId: "metric-revenue",
      userId: SEED_USER_ID,
      value: isWeekend ? 0 : parseFloat(revenue.toFixed(2)),
    },
    {
      time: date,
      metricId: "metric-focus",
      userId: SEED_USER_ID,
      value: isWeekend
        ? parseFloat(randomNoise(1.5, 1).toFixed(1))
        : parseFloat(focus.toFixed(1)),
    }
  );
}

// Insert in batches
const batchSize = 100;
for (let i = 0; i < points.length; i += batchSize) {
  await db.insert(dataPoints).values(points.slice(i, i + batchSize));
}

console.log(`Seeded ${points.length} data points across 5 metrics (90 days).`);
console.log(`Dev user: ${SEED_USER_EMAIL}`);
await client.end();
