import fp from 'fastify-plugin';
import Redis from 'ioredis';

declare module 'fastify' {
  interface FastifyInstance {
    redisSub: Redis;
  }
}

export const redisSubPlugin = fp(async (fastify) => {
  try {
    fastify.log.info('Connecting to Redis Sub...');
    const redisSub = fastify.redis.duplicate();

    await new Promise<void>((resolve, reject) => {
      redisSub.once('ready', resolve);
      redisSub.once('error', reject);
    });

    fastify.decorate('redisSub', redisSub);
    fastify.log.info('Redis Sub connected successfully');

    fastify.addHook('onClose', async () => {
      await redisSub.quit();
    });
  } catch (err) {
    fastify.log.error('Failed to connect to Redis Sub');
    throw err;
  }
});
