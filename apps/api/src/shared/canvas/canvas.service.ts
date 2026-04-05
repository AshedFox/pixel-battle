import {
  CANVAS_COLORS,
  CANVAS_SIZE,
  CANVAS_WIDTH,
  PixelUpdateData,
} from '@repo/shared';
import Redis from 'ioredis';
import { config } from '../../config';
import { Database } from '../../db';
import { drawEvents } from '../../db/schema/draw-events';
import { canvasSnapshots } from '../../db/schema/canvas-snapshots';
import { and, asc, count, desc, gte, lte } from 'drizzle-orm';
import { streamQuery } from '../pg/stream';

const CANVAS_KEY = 'canvas:state';
const COOLDOWN_KEY_PREFIX = 'canvas:users-cooldown';

export class CanvasService {
  private colorsBuffers = Array.from({ length: CANVAS_COLORS.length }, (_, i) =>
    Buffer.from([i]),
  );

  constructor(
    private readonly redis: Redis,
    private readonly db: Database['db'],
  ) {}

  async getFullState(): Promise<Buffer> {
    const buffer = await this.redis.getBuffer(CANVAS_KEY);

    if (!buffer) {
      return Buffer.alloc(CANVAS_SIZE);
    }

    return buffer;
  }

  async getFullStateAt(date: Date) {
    const snapshot = await this.getLastSnapshot(date);

    const canvas = snapshot?.data
      ? Buffer.from(snapshot.data)
      : Buffer.alloc(CANVAS_SIZE);

    const startDate = snapshot ? snapshot.timestamp : new Date(0);

    const query = this.db
      .select({
        x: drawEvents.x,
        y: drawEvents.y,
        color: drawEvents.color,
      })
      .from(drawEvents)
      .where(
        and(
          gte(drawEvents.timestamp, startDate),
          lte(drawEvents.timestamp, date),
        ),
      )
      .orderBy(asc(drawEvents.timestamp))
      .toSQL();

    for await (const { x, y, color } of streamQuery<PixelUpdateData>(
      this.db.$client,
      query,
    )) {
      canvas[y * CANVAS_WIDTH + x] = color;
    }

    return canvas;
  }

  async getEventsCountSince(timestamp?: Date) {
    return timestamp
      ? this.db
          .select({ count: count() })
          .from(drawEvents)
          .where(gte(drawEvents.timestamp, timestamp))
          .then((r) => r[0])
      : this.db
          .select({ count: count() })
          .from(drawEvents)
          .then((r) => r[0]);
  }

  async getLastSnapshot(timestamp?: Date) {
    return timestamp
      ? this.db
          .select()
          .from(canvasSnapshots)
          .where(lte(canvasSnapshots.timestamp, timestamp))
          .orderBy(desc(canvasSnapshots.timestamp))
          .limit(1)
          .then((r) => r[0] ?? null)
      : this.db
          .select()
          .from(canvasSnapshots)
          .orderBy(desc(canvasSnapshots.timestamp))
          .limit(1)
          .then((r) => r[0] ?? null);
  }

  async saveSnapshot(data: Buffer, timestamp?: Date): Promise<void> {
    await this.db.insert(canvasSnapshots).values({
      data,
      timestamp: timestamp ?? new Date(),
    });
  }

  async setPixel(x: number, y: number, color: number): Promise<void> {
    const offset = y * CANVAS_WIDTH + x;
    await this.redis.setrange(CANVAS_KEY, offset, Buffer.from([color]));
  }

  async setPixels(pixels: Array<PixelUpdateData>): Promise<void> {
    if (pixels.length === 0) {
      return;
    }

    const pipeline = this.redis.pipeline();

    for (const { x, y, color } of pixels) {
      const offset = y * CANVAS_WIDTH + x;
      pipeline.setrange(CANVAS_KEY, offset, this.colorsBuffers[color]);
    }

    await pipeline.exec();
  }

  async initIfEmpty(): Promise<void> {
    const exists = await this.redis.exists(CANVAS_KEY);
    if (!exists) {
      await this.redis.set(CANVAS_KEY, Buffer.alloc(CANVAS_SIZE));
    }
  }

  async getUserCooldown(userId: string): Promise<Date | null> {
    const cooldownStr = await this.redis.get(
      `${COOLDOWN_KEY_PREFIX}:${userId}`,
    );
    return cooldownStr ? new Date(cooldownStr) : null;
  }

  async setUserCooldown(userId: string): Promise<boolean> {
    const result = await this.redis.set(
      `${COOLDOWN_KEY_PREFIX}:${userId}`,
      new Date(Date.now() + config.PIXEL_COOLDOWN_MS).toISOString(),
      'PX',
      config.PIXEL_COOLDOWN_MS,
      'NX',
    );

    if (result === null) {
      return false;
    }

    return true;
  }
}
