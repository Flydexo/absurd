import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { dataPoints, metrics } from "@absurd/db";
import { eq, and, gte, lte, desc, sql } from "drizzle-orm";

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
