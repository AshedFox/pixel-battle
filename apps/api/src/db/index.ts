import { drizzle } from 'drizzle-orm/node-postgres';
import { config } from '../config';

export type Database = ReturnType<typeof createDatabase>;

export function createDatabase() {
  const db = drizzle(config.DATABASE_URL);
  const pool = db.$client;

  return { db, pool };
}
