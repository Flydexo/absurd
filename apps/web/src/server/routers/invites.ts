import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { invites } from "@absurd/db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const invitesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.invites.findMany({
      where: eq(invites.createdBy, ctx.userId),
      orderBy: (i, { desc }) => [desc(i.createdAt)],
    });
  }),

  create: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const id = randomUUID();
      await ctx.db.insert(invites).values({
        id,
        email: input.email,
        createdBy: ctx.userId,
      });
      return { id };
    }),

  revoke: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(invites)
        .where(eq(invites.id, input.id));
    }),
});
