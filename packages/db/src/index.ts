import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

const connectionString = process.env.POSTGRES_URL!;

// Disable prefetch for serverless environments
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });

export * from "./schema";
export type { InferSelectModel, InferInsertModel } from "drizzle-orm";
