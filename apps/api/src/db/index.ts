import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from '../config';

export type Database = Awaited<ReturnType<typeof createDatabase>>;

export async function createDatabase() {
  const db = drizzle(config.DATABASE_URL);
  const pool = db.$client;

  const client = await pool.connect();
  client.release();

  return { db, pool };
}
