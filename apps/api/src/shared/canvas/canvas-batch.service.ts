import { randomUUID } from 'crypto';
import { config } from '../../config';
import { NewDrawEvent } from '../../db/schema/draw-events';
import Redis from 'ioredis';

const STREAM_KEY = 'canvas:draw_events';
const GROUP_NAME = 'canvas_workers';
const CONSUMER_NAME = `worker:${randomUUID()}`;
const PENDING_CLAIM_THRESHOLD_MS = 30_000;

export class CanvasBatchService {
  private interval?: NodeJS.Timeout;

  constructor(
    private readonly redis: Redis,
    private readonly onFlush: (events: NewDrawEvent[]) => Promise<void> | void,
  ) {}

  async add(event: NewDrawEvent) {
    await this.redis.xadd(STREAM_KEY, '*', 'data', JSON.stringify(event));
  }

  async recoverProcessing() {
    await this.claimPending();
  }

  private async claimPending(): Promise<void> {
    await this.redis.xautoclaim(
      STREAM_KEY,
      GROUP_NAME,
      CONSUMER_NAME,
      PENDING_CLAIM_THRESHOLD_MS,
      '0-0',
    );
  }

  private parseMsgsToEvents(messages: [string, string[]][]): NewDrawEvent[] {
    return messages.map(([, fields]) => {
      const raw = JSON.parse(fields[1]);
      return { ...raw, timestamp: new Date(raw.timestamp) };
    });
  }

  async flush() {
    await this.claimPending();

    let results = await this.redis.xreadgroup(
      'GROUP',
      GROUP_NAME,
      CONSUMER_NAME,
      'COUNT',
      String(config.CANVAS_FLUSH_THRESHOD),
      'STREAMS',
      STREAM_KEY,
      '0',
    );

    let [, messages] = (results?.[0] || ['', []]) as [
      string,
      [string, string[]][],
    ];

    if (messages.length === 0) {
      results = await this.redis.xreadgroup(
        'GROUP',
        GROUP_NAME,
        CONSUMER_NAME,
        'COUNT',
        String(config.CANVAS_FLUSH_THRESHOD),
        'STREAMS',
        STREAM_KEY,
        '>',
      );
    }

    [, messages] = (results?.[0] || ['', []]) as [string, [string, string[]][]];

    if (messages.length === 0) {
      return;
    }

    const ids = messages.map(([id]) => id);
    const events = this.parseMsgsToEvents(messages);

    try {
      await this.onFlush(events);
      await this.redis.xack(STREAM_KEY, GROUP_NAME, ...ids);
    } catch {
      console.error('Failed to process stream batch');
    }
  }

  async ensureGroup(): Promise<void> {
    try {
      await this.redis.xgroup(
        'CREATE',
        STREAM_KEY,
        GROUP_NAME,
        '$',
        'MKSTREAM',
      );
    } catch (err: unknown) {
      if (!(err instanceof Error) || !err.message.includes('BUSYGROUP')) {
        throw err;
      }
      // Else group already exists - OK
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
