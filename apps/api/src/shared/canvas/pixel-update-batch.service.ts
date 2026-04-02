import { CANVAS_WIDTH, PixelUpdateData } from '@repo/shared';
import { PubSubService } from '../pubsub/pubsub.service';
import { config } from '../../config';

export class PixelUpdateBatchService {
  private buffer = new Map<number, PixelUpdateData>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private flushPromise: Promise<void> | null = null;

  constructor(
    private readonly pubSub: PubSubService,
    private readonly onFlush: (data: PixelUpdateData[]) => Promise<void> | void,
  ) {}

  publish(pixel: PixelUpdateData): void {
    const offset = pixel.y * CANVAS_WIDTH + pixel.x;
    this.buffer.set(offset, pixel);

    if (
      this.buffer.size > config.PIXEL_UPDATE_BUFFER_MAX &&
      !this.flushPromise
    ) {
      if (this.timer !== null) {
        clearTimeout(this.timer);
        this.timer = null;
      }
      void this.flush();
      return;
    }

    this.scheduleFlush();
  }

  private async flush(): Promise<void> {
    if (this.flushPromise) {
      return;
    }

    this.flushPromise = this.doFlush();
    this.timer = null;

    try {
      await this.flushPromise;
    } finally {
      this.flushPromise = null;
      if (this.buffer.size >= config.PIXEL_UPDATE_BUFFER_MAX) {
        void this.flush();
      } else {
        this.scheduleFlush();
      }
    }
  }

  private scheduleFlush(): void {
    if (this.timer !== null || this.flushPromise || this.buffer.size === 0) {
      return;
    }
    this.timer = setTimeout(
      () => this.flush(),
      config.PIXEL_UPDATE_FLUSH_INTERVAL,
    );
  }

  private async doFlush(): Promise<void> {
    if (this.buffer.size === 0) {
      return;
    }

    const batch = [...this.buffer.values()];
    this.buffer.clear();

    await this.onFlush(batch);

    await this.pubSub.publish(
      batch.length === 1
        ? { type: 'pixelUpdated', data: batch[0] }
        : { type: 'pixelsUpdated', data: batch },
    );
  }

  async stop(): Promise<void> {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    await this.flushPromise;
    await this.flush();
  }
}
