import { Database } from '../../db';
import { drawEvents } from '../../db/schema/draw-events';
import Redis from 'ioredis';

type DrawEvent = {
  x: number;
  y: number;
  timestamp: Date;
  color: number;
  userId: string;
};

const EVENTS_KEY = 'canvas:draw_events';
const PROCESSING_EVENTS_KEY = 'canvas:draw_events_processing';
const DEFAULT_FLUSH_INTERVAL_MS = 1_000;
const DEFAULT_FLUSH_THRESHOLD = 500;

export class CanvasBatchService {
  private interval?: NodeJS.Timeout;
  private isFlushing = false;

  constructor(
    private readonly db: Database['db'],
    private readonly redis: Redis,
    private readonly flushThreshold = DEFAULT_FLUSH_THRESHOLD,
  ) {}

  async add(event: DrawEvent) {
    const length = await this.redis.rpush(EVENTS_KEY, JSON.stringify(event));

    if (length >= this.flushThreshold) {
      void this.flush();
    }
  }

  async recoverProcessing() {
    const exists = await this.redis.exists(PROCESSING_EVENTS_KEY);
    if (exists) {
      await this.redis.rename(PROCESSING_EVENTS_KEY, EVENTS_KEY);
    }
  }

  async flush() {
    if (this.isFlushing) {
      return;
    }

    try {
      this.isFlushing = true;

      try {
        await this.redis.rename(EVENTS_KEY, PROCESSING_EVENTS_KEY);
      } catch {
        return;
      }

      const items = await this.redis.lrange(PROCESSING_EVENTS_KEY, 0, -1);

      const batch: DrawEvent[] = items.map((item) => {
        const parsed = JSON.parse(item);
        return {
          ...parsed,
          timestamp: new Date(parsed.timestamp),
        };
      });

      try {
        await this.db.insert(drawEvents).values(batch);
        await this.redis.del(PROCESSING_EVENTS_KEY);
      } catch {
        await this.redis.rename(PROCESSING_EVENTS_KEY, EVENTS_KEY);
      }
    } finally {
      this.isFlushing = false;
    }
  }

  start(ms = DEFAULT_FLUSH_INTERVAL_MS) {
    this.interval = setInterval(() => void this.flush(), ms);
  }

  async stop() {
    clearInterval(this.interval);
    this.interval = undefined;
    await this.flush();
  }
}
