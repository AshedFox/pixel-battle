import {
  CANVAS_COLORS,
  CANVAS_SIZE,
  CANVAS_WIDTH,
  PixelUpdateData,
} from '@repo/shared';
import Redis from 'ioredis';
import { config } from '../../config';

const CANVAS_KEY = 'canvas:state';
const COOLDOWN_KEY_PREFIX = 'canvas:users-cooldown';

export class CanvasService {
  private colorsBuffers = Array.from({ length: CANVAS_COLORS.length }, (_, i) =>
    Buffer.from([i]),
  );

  constructor(private readonly redis: Redis) {}

  async getFullState(): Promise<Buffer> {
    const buffer = await this.redis.getBuffer(CANVAS_KEY);

    if (!buffer) {
      return Buffer.alloc(CANVAS_SIZE);
    }

    return buffer;
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
