import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { metrics } from "./metrics";

export const northStarConfig = pgTable("north_star_config", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  metricId: text("metric_id")
    .notNull()
    .references(() => metrics.id, { onDelete: "cascade" }),
  updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
});
