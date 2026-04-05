import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { config } from '../src/config';
import { CanvasService } from '../src/shared/canvas/canvas.service';

async function sync() {
  const pool = new Pool({ connectionString: config.DATABASE_URL });
  const db = drizzle(pool);
  const redis = new Redis(config.REDIS_URL);

  const canvasService = new CanvasService(redis, db);

  console.log('------Starting Canvas Synchronization-----');
  console.log('Reconstructing full state from database...');

  try {
    await canvasService.syncWithDb();

    console.log(`Successfully synchronized Redis with the database truth.`);
  } catch (err) {
    console.error('Synchronization failed:', err);
  } finally {
    await pool.end();
    redis.disconnect();
  }
}

sync().catch((err) => {
  console.error('Fatal error during sync:', err);
  process.exit(1);
});
