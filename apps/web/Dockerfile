# Stage 1: builder — install + build with full monorepo context
FROM oven/bun:1 AS builder
WORKDIR /app

COPY . .
RUN bun install

# Generate DB migration files (no DB connection needed, reads schema TS only)
WORKDIR /app/packages/db
RUN POSTGRES_URL=postgresql://x:x@x/x bun run db:generate

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app/apps/web
RUN bun run build

# Stage 2: runner — lean production image
FROM oven/bun:1-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

# Standalone output mirrors the monorepo tree: server.js is at apps/web/server.js
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

# Migration script and generated SQL files
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/src/migrate.ts ./packages/db/src/migrate.ts
COPY --from=builder --chown=nextjs:nodejs /app/packages/db/drizzle ./packages/db/drizzle

USER nextjs

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Run migrations then start the server
CMD ["sh", "-c", "bun run ./packages/db/src/migrate.ts && bun run ./apps/web/server.js"]
