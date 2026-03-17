import {
  pgTable,
  text,
  timestamp,
  doublePrecision,
  index,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { metrics } from "./metrics";

// This table is converted to a TimescaleDB hypertable in the migration
export const dataPoints = pgTable(
  "data_points",
  {
    time: timestamp("time", { withTimezone: true, mode: "date" })
      .notNull()
      .defaultNow(),
    metricId: text("metric_id")
      .notNull()
      .references(() => metrics.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    value: doublePrecision("value").notNull(),
    notes: text("notes"),
  },
  (table) => ({
    timeIdx: index("data_points_time_idx").on(table.time),
    metricTimeIdx: index("data_points_metric_time_idx").on(
      table.metricId,
      table.time
    ),
    userTimeIdx: index("data_points_user_time_idx").on(table.userId, table.time),
  })
);
