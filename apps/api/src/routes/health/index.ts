import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';

export const healthRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const withTimeout = async <T>(
    promise: Promise<T>,
    ms: number,
  ): Promise<T> => {
    let timer: ReturnType<typeof setTimeout>;

    try {
      return await Promise.race([
        promise,
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error('timeout')), ms);
        }),
      ]);
    } finally {
      clearTimeout(timer!);
    }
  };

  fastify.get('/health', async (_, reply) => {
    reply.header('cache-control', 'no-store');

    const [dbResult, redisResult] = await Promise.allSettled([
      withTimeout(fastify.db.execute('SELECT 1'), 2000),
      withTimeout(fastify.redis.ping(), 2000),
    ]);

    const healthy =
      dbResult.status === 'fulfilled' && redisResult.status === 'fulfilled';

    return reply.code(healthy ? 200 : 503).send({
      status: healthy ? 'ok' : 'error',
      checks: {
        database: dbResult.status === 'fulfilled' ? 'ok' : 'error',
        redis: redisResult.status === 'fulfilled' ? 'ok' : 'error',
      },
    });
  });
};
