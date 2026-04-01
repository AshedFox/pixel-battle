import { config } from '../../config';
import { NewDrawEvent } from '../../db/schema/draw-events';
import Redis from 'ioredis';

const EVENTS_KEY = 'canvas:draw_events';
const PROCESSING_EVENTS_KEY = 'canvas:draw_events_processing';

export class CanvasBatchService {
  private interval?: NodeJS.Timeout;
  private isFlushing = false;

  constructor(
    private readonly redis: Redis,
    private readonly onFlush: (events: NewDrawEvent[]) => Promise<void> | void,
  ) {}

  async add(event: NewDrawEvent) {
    const length = await this.redis.rpush(EVENTS_KEY, JSON.stringify(event));

    if (length >= config.CANVAS_FLUSH_THRESHOD) {
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

      const batch: NewDrawEvent[] = items.map((item) => {
        const parsed = JSON.parse(item);
        return {
          ...parsed,
          timestamp: new Date(parsed.timestamp),
        };
      });

      try {
        await this.onFlush(batch);
        await this.redis.del(PROCESSING_EVENTS_KEY);
      } catch {
        console.error('Failed to process batched events');
        await this.redis.rename(PROCESSING_EVENTS_KEY, EVENTS_KEY);
      }
    } finally {
      this.isFlushing = false;
    }
  }

  start() {
    this.interval = setInterval(
      () => void this.flush(),
      config.CANVAS_FLUSH_INTERVAL,
    );
  }

  async stop() {
    clearInterval(this.interval);
    this.interval = undefined;
    await this.flush();
  }
}
