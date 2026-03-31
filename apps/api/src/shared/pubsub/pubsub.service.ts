import { WsServerMessage } from '@repo/shared';
import Redis from 'ioredis';

export class PubSubService {
  constructor(
    private readonly redisPub: Redis,
    private readonly redisSub: Redis,
    private readonly channel: string,
  ) {}

  async publish(message: WsServerMessage) {
    await this.redisPub.publish(this.channel, JSON.stringify(message));
  }

  async subscribe(onMessage: (message: WsServerMessage) => void) {
    await this.redisSub.subscribe(this.channel);

    this.redisSub.on('message', (ch, raw) => {
      try {
        const parsed = JSON.parse(raw) as WsServerMessage;
        onMessage(parsed);
      } catch {
        console.error(`Failed to process ws message on ${ch} channel`);
      }
    });
  }

  async unsubscribe() {
    await this.redisSub.unsubscribe(this.channel);
    this.redisSub.removeAllListeners('message');
  }
}
