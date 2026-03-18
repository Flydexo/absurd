import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { dataPoints, metrics } from "@absurd/db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";
import { randomUUID } from "crypto";

export const dataPointsRouter = router({
  range: protectedProcedure
    .input(
      z.object({
        metricId: z.string(),
        from: z.date(),
        to: z.date().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [
        eq(dataPoints.metricId, input.metricId),
        eq(dataPoints.userId, ctx.userId),
        gte(dataPoints.time, input.from),
      ];
      if (input.to) {
        conditions.push(lte(dataPoints.time, input.to));
      }
      return ctx.db
        .select({ time: dataPoints.time, value: dataPoints.value, notes: dataPoints.notes })
        .from(dataPoints)
        .where(and(...conditions))
        .orderBy(dataPoints.time);
    }),

  latest: protectedProcedure
    .input(z.object({ metricId: z.string() }))
    .query(async ({ ctx, input }) => {
      const [row] = await ctx.db
        .select({ time: dataPoints.time, value: dataPoints.value })
        .from(dataPoints)
        .where(
          and(
            eq(dataPoints.metricId, input.metricId),
            eq(dataPoints.userId, ctx.userId)
          )
        )
        .orderBy(desc(dataPoints.time))
        .limit(1);
      return row ?? null;
    }),

  // Returns all metrics with their latest value + 30-day history for the dashboard
  dashboardSummary: protectedProcedure
    .input(z.object({ days: z.number().int().min(7).max(365).default(30) }))
    .query(async ({ ctx, input }) => {
      const from = new Date();
      from.setDate(from.getDate() - input.days);

      const userMetrics = await ctx.db.query.metrics.findMany({
        where: eq(metrics.userId, ctx.userId),
        orderBy: (m, { asc }) => [asc(m.createdAt)],
      });

      const summaries = await Promise.all(
        userMetrics.map(async (metric) => {
          const points = await ctx.db
            .select({ time: dataPoints.time, value: dataPoints.value })
            .from(dataPoints)
            .where(
              and(
                eq(dataPoints.metricId, metric.id),
                eq(dataPoints.userId, ctx.userId),
                gte(dataPoints.time, from)
              )
            )
            .orderBy(dataPoints.time);

          const latest = points.at(-1) ?? null;
          const previous = points.at(-2) ?? null;
          const delta =
            latest && previous ? latest.value - previous.value : null;
          const deltaPercent =
            delta !== null && previous && previous.value !== 0
              ? (delta / previous.value) * 100
              : null;

          return {
            metric,
            latestValue: latest?.value ?? null,
            latestTime: latest?.time ?? null,
            delta,
            deltaPercent,
            history: points,
          };
        })
      );

      return summaries;
    }),

  seedDummyData: protectedProcedure
    .input(z.object({ days: z.number().int().min(7).max(365).default(30) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      // Get or create default metrics
      let userMetrics = await ctx.db.query.metrics.findMany({
        where: eq(metrics.userId, userId),
      });

      if (userMetrics.length === 0) {
        const defaults = [
          { name: "Mood", unit: "/10", color: "#f59e0b" },
          { name: "Sleep", unit: "hrs", color: "#6366f1" },
          { name: "Weight", unit: "kg", color: "#22c55e" },
          { name: "Focus", unit: "hrs", color: "#14b8a6" },
          { name: "Revenue", unit: "$", color: "#ec4899" },
        ];
        await ctx.db.insert(metrics).values(
          defaults.map((d) => ({ id: randomUUID(), userId, ...d }))
        );
        userMetrics = await ctx.db.query.metrics.findMany({
          where: eq(metrics.userId, userId),
        });
      }

      // Delete existing data in the seeded range
      const from = new Date();
      from.setDate(from.getDate() - input.days);
      await ctx.db
        .delete(dataPoints)
        .where(and(eq(dataPoints.userId, userId), gte(dataPoints.time, from)));

      // Generate correlated random walk data
      function clamp(v: number, min: number, max: number) {
        return Math.min(max, Math.max(min, v));
      }

      const points: (typeof dataPoints.$inferInsert)[] = [];
      const now = new Date();

      // Per-metric state
      const state: Record<string, number> = {};
      const configs: Record<string, { base: number; min: number; max: number; spread: number }> = {
        Mood: { base: 6.5, min: 1, max: 10, spread: 0.6 },
        Sleep: { base: 7.2, min: 4, max: 10, spread: 0.75 },
        Weight: { base: 78, min: 70, max: 85, spread: 0.15 },
        Focus: { base: 4.5, min: 0, max: 10, spread: 0.5 },
        Revenue: { base: 150, min: 0, max: 800, spread: 20 },
      };

      for (const m of userMetrics) {
        const cfg = configs[m.name] ?? { base: 50, min: 0, max: 100, spread: 5 };
        state[m.id] = cfg.base;
      }

      for (let d = input.days - 1; d >= 0; d--) {
        const date = new Date(now);
        date.setDate(date.getDate() - d);
        date.setHours(9, 0, 0, 0);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

        for (const m of userMetrics) {
          const cfg = configs[m.name] ?? { base: 50, min: 0, max: 100, spread: 5 };
          let val = state[m.id];
          val = clamp(val + (Math.random() - 0.5) * cfg.spread * 2, cfg.min, cfg.max);
          if ((m.name === "Revenue" || m.name === "Focus") && isWeekend) {
            val = clamp(val * 0.2, cfg.min, cfg.max);
          }
          state[m.id] = val;
          points.push({
            time: date,
            metricId: m.id,
            userId,
            value: parseFloat(val.toFixed(1)),
          });
        }
      }

      const batchSize = 100;
      for (let i = 0; i < points.length; i += batchSize) {
        await ctx.db.insert(dataPoints).values(points.slice(i, i + batchSize));
      }

      return { inserted: points.length, metrics: userMetrics.length, days: input.days };
    }),

  bulkInsert: protectedProcedure
    .input(
      z.object({
        points: z
          .array(
            z.object({
              metricId: z.string(),
              time: z.date(),
              value: z.number(),
            })
          )
          .max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.userId;

      // Verify all metricIds belong to this user
      const userMetrics = await ctx.db.query.metrics.findMany({
        where: eq(metrics.userId, userId),
      });
      const validIds = new Set(userMetrics.map((m) => m.id));
      const filtered = input.points.filter((p) => validIds.has(p.metricId));

      if (filtered.length === 0) return { inserted: 0 };

      // Upsert: delete existing points at the exact same (metricId, day) slots
      // Group by metricId + day to build targeted deletes
      const slots = new Map<string, { metricId: string; day: Date }>();
      for (const p of filtered) {
        const day = new Date(p.time);
        day.setHours(0, 0, 0, 0);
        const key = `${p.metricId}::${day.toISOString()}`;
        if (!slots.has(key)) slots.set(key, { metricId: p.metricId, day });
      }

      for (const { metricId, day } of slots.values()) {
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        await ctx.db
          .delete(dataPoints)
          .where(
            and(
              eq(dataPoints.userId, userId),
              eq(dataPoints.metricId, metricId),
              gte(dataPoints.time, day),
              lte(dataPoints.time, dayEnd)
            )
          );
      }

      const rows = filtered.map((p) => ({
        time: p.time,
        metricId: p.metricId,
        userId,
        value: p.value,
      }));

      const batchSize = 500;
      for (let i = 0; i < rows.length; i += batchSize) {
        await ctx.db.insert(dataPoints).values(rows.slice(i, i + batchSize));
      }

      return { inserted: rows.length };
    }),

  // Pearson correlation between two metrics over N days
  correlation: protectedProcedure
    .input(
      z.object({
        metricIdA: z.string(),
        metricIdB: z.string(),
        days: z.number().int().min(7).max(365).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const from = new Date();
      from.setDate(from.getDate() - input.days);

      // Use TimescaleDB time_bucket to align by day
      const result = await ctx.db.execute(sql`
        WITH
          a AS (
            SELECT date_trunc('day', time) AS day, AVG(value) AS val
            FROM data_points
            WHERE metric_id = ${input.metricIdA}
              AND user_id = ${ctx.userId}
              AND time >= ${from}
            GROUP BY 1
          ),
          b AS (
            SELECT date_trunc('day', time) AS day, AVG(value) AS val
            FROM data_points
            WHERE metric_id = ${input.metricIdB}
              AND user_id = ${ctx.userId}
              AND time >= ${from}
            GROUP BY 1
          ),
          joined AS (
            SELECT a.val AS va, b.val AS vb
            FROM a JOIN b ON a.day = b.day
          )
        SELECT
          CORR(va, vb) AS coefficient,
          COUNT(*) AS sample_size
        FROM joined
      `);

      const row = result[0] as { coefficient: number | null; sample_size: number } | undefined;
      return {
        metricIdA: input.metricIdA,
        metricIdB: input.metricIdB,
        coefficient: row?.coefficient ?? null,
        sampleSize: Number(row?.sample_size ?? 0),
        days: input.days,
      };
    }),
});
