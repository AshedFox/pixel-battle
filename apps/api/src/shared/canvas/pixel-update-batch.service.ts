import { PixelUpdateData } from '@repo/shared';
import { PubSubService } from '../pubsub/pubsub.service';
import { config } from '../../config';

export class PixelUpdateBatchService {
  private buffer: PixelUpdateData[] = [];
  private timer: ReturnType<typeof setTimeout> | null = null;
  private isFlushing = false;

  constructor(
    private readonly pubSub: PubSubService,
    private readonly onFlush: (data: PixelUpdateData[]) => Promise<void> | void,
  ) {}

  publish(pixel: PixelUpdateData): void {
    this.buffer.push(pixel);

    if (this.timer === null) {
      this.timer = setTimeout(
        () => this.flush(),
        config.PIXEL_UPDATE_FLUSH_INTERVAL,
      );
    }
  }

  private async flush(): Promise<void> {
    if (this.isFlushing) {
      return;
    }

    this.isFlushing = true;
    this.timer = null;

    try {
      if (this.buffer.length === 0) {
        return;
      }

      const batch = this.buffer.splice(0);

      await this.onFlush(batch);

      await this.pubSub.publish(
        batch.length === 1
          ? { type: 'pixelUpdated', data: batch[0] }
          : { type: 'pixelsUpdated', data: batch },
      );
    } finally {
      this.isFlushing = false;
    }
  }

  async stop(): Promise<void> {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    while (this.isFlushing) {
      await new Promise((r) => setImmediate(r));
    }
    await this.flush();
  }
}
