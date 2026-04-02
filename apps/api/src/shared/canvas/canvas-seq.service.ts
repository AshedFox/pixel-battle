import Redis from 'ioredis';

const SEQ_KEY = 'canvas:seq';

export class CanvasSeqService {
  constructor(private readonly redis: Redis) {}

  increment(): Promise<number> {
    return this.redis.incr(SEQ_KEY);
  }
}
