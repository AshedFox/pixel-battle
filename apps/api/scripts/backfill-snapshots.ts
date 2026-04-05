import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import Redis from 'ioredis';
import { config } from '../src/config';
import { drawEvents } from '../src/db/schema/draw-events';
import { CanvasService } from '../src/shared/canvas/canvas.service';
import { asc, gt } from 'drizzle-orm';

const pool = new Pool({ connectionString: config.DATABASE_URL });
const db = drizzle(pool);
const redis = new Redis(config.REDIS_URL);

async function backfill() {
  const canvasService = new CanvasService(redis, db);

  console.log('Finding starting point...');

  const lastSnapshot = await canvasService.getLastSnapshot();
  let currentTimestamp = lastSnapshot?.timestamp ?? new Date(0);

  if (lastSnapshot) {
    console.log(
      `Starting from last snapshot at ${currentTimestamp.toISOString()}`,
    );
  } else {
    console.log('No snapshots found. Starting from the beginning of time.');
  }

  const threshold = config.CANVAS_SNAPSHOT_THRESHOLD;
  let snapshotsCreated = 0;

  while (true) {
    const nextTarget = await db
      .select({ timestamp: drawEvents.timestamp })
      .from(drawEvents)
      .where(gt(drawEvents.timestamp, currentTimestamp))
      .orderBy(asc(drawEvents.timestamp))
      .offset(threshold - 1)
      .limit(1)
      .then((r) => r[0]?.timestamp ?? null);

    if (!nextTarget) {
      console.log('Threshold not reached for a new snapshot. Stopping.');
      break;
    }

    console.log(`Reconstructing canvas at ${nextTarget.toISOString()}...`);

    const canvas = await canvasService.getFullStateAt(nextTarget);
    await canvasService.saveSnapshot(canvas, nextTarget);

    console.log(
      `Saved snapshot #${++snapshotsCreated} for ${nextTarget.toISOString()}`,
    );
    currentTimestamp = nextTarget;
  }

  console.log(`Backfill complete! Created ${snapshotsCreated} snapshots.`);
}

backfill()
  .catch((err) => {
    console.error('Backfill failed:', err);
  })
  .finally(async () => {
    await pool.end();
    redis.disconnect();
  });
