import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { northStarConfig, metrics } from "@absurd/db";
import { eq, and } from "drizzle-orm";

export const northStarRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const config = await ctx.db.query.northStarConfig.findFirst({
      where: eq(northStarConfig.userId, ctx.userId),
    });
    if (!config) return null;

    const metric = await ctx.db.query.metrics.findFirst({
      where: and(
        eq(metrics.id, config.metricId),
        eq(metrics.userId, ctx.userId)
      ),
    });

    return metric ? { ...config, metric } : null;
  }),

  set: protectedProcedure
    .input(z.object({ metricId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Verify metric belongs to user
      const metric = await ctx.db.query.metrics.findFirst({
        where: and(
          eq(metrics.id, input.metricId),
          eq(metrics.userId, ctx.userId)
        ),
      });
      if (!metric) throw new Error("Metric not found");

      await ctx.db
        .insert(northStarConfig)
        .values({
          userId: ctx.userId,
          metricId: input.metricId,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: northStarConfig.userId,
          set: { metricId: input.metricId, updatedAt: new Date() },
        });
    }),
});
