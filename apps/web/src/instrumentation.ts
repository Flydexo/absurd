export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { default: postgres } = await import("postgres");
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { migrate } = await import("drizzle-orm/postgres-js/migrator");
    const client = postgres(process.env.POSTGRES_URL!, { max: 1 });
    const db = drizzle(client);

    await migrate(db, {
      migrationsFolder: "/app/packages/db/drizzle",
    });

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

    await client.end();
  }
}
