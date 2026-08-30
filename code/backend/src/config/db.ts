import { Pool } from "pg";
import { env } from "./env";

// Uses the Supabase transaction pooler connection for normal app queries.
export const pool = new Pool({
  connectionString: env.databaseUrl,
  ssl: { rejectUnauthorized: false },
});

export async function checkDbConnection(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch (err) {
    console.error("Database connection check failed:", err);
    return false;
  }
}
