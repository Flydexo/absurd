import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const metrics = pgTable("metrics", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  unit: text("unit").notNull().default(""),
  color: text("color").notNull().default("#f59e0b"),
  description: text("description"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});
