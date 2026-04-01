import Redis from 'ioredis';
import { PubSubService } from '../pubsub/pubsub.service';
import { config } from '../../config';

const ONLINE_KEY = 'canvas:online';

export class CanvasOnlineService {
  private heartbeats = new Map<string, NodeJS.Timeout>();
  private broadcastInterval?: NodeJS.Timeout;
  private readonly hearbeatWithMargin =
    config.ONLINE_HEARTBEAT_INTERVAL + 5_000;

  constructor(
    private readonly redis: Redis,
    private readonly pubSub: PubSubService,
  ) {}

  async connect(userId: string): Promise<void> {
    await this.redis.zadd(
      ONLINE_KEY,
      Date.now() + this.hearbeatWithMargin,
      userId,
    );

    const interval = setInterval(async () => {
      await this.redis.zadd(
        ONLINE_KEY,
        Date.now() + this.hearbeatWithMargin,
        userId,
      );
    }, config.ONLINE_HEARTBEAT_INTERVAL);

    this.heartbeats.set(userId, interval);
  }

  async disconnect(userId: string): Promise<void> {
    clearInterval(this.heartbeats.get(userId));

    this.heartbeats.delete(userId);
    await this.redis.zrem(ONLINE_KEY, userId);
  }

  async getCount(): Promise<number> {
    const pipeline = this.redis.pipeline();

    pipeline.zremrangebyscore(ONLINE_KEY, 0, Date.now());
    pipeline.zcard(ONLINE_KEY);

    const results = await pipeline.exec();

    return (results?.[1]?.[1] as number) ?? 0;
  }

  async startBroadcast(): Promise<void> {
    const count = await this.getCount();
    await this.pubSub.publish({ type: 'onlineCount', data: count });

    this.broadcastInterval = setInterval(async () => {
      const count = await this.getCount();
      await this.pubSub.publish({ type: 'onlineCount', data: count });
    }, config.ONLINE_HEARTBEAT_INTERVAL);
  }

  stopBroadcast(): void {
    clearInterval(this.broadcastInterval);
  }
}
