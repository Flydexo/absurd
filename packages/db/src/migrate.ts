import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString = process.env.POSTGRES_URL!;

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

console.log("Running migrations...");
await migrate(db, { migrationsFolder: path.join(__dirname, "../drizzle") });

// Create TimescaleDB hypertable if not already done
await client`
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM timescaledb_information.hypertables
      WHERE hypertable_name = 'data_points'
    ) THEN
      PERFORM create_hypertable('data_points', 'time');
    END IF;
  END
  $$;
`;

console.log("Migrations complete.");
await client.end();
