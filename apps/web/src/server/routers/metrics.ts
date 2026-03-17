import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { metrics } from "@absurd/db";
import { eq, and } from "drizzle-orm";
import { randomUUID } from "crypto";

export const metricsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.metrics.findMany({
      where: eq(metrics.userId, ctx.userId),
      orderBy: (m, { asc }) => [asc(m.createdAt)],
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(50),
        unit: z.string().max(10).default(""),
        color: z.string().regex(/^#[0-9a-f]{6}$/i).default("#f59e0b"),
        description: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const id = randomUUID();
      await ctx.db.insert(metrics).values({
        id,
        userId: ctx.userId,
        name: input.name,
        unit: input.unit,
        color: input.color,
        description: input.description ?? null,
      });
      return { id };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(50).optional(),
        unit: z.string().max(10).optional(),
        color: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
        description: z.string().max(200).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      await ctx.db
        .update(metrics)
        .set(updates)
        .where(and(eq(metrics.id, id), eq(metrics.userId, ctx.userId)));
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(metrics)
        .where(and(eq(metrics.id, input.id), eq(metrics.userId, ctx.userId)));
    }),
});
