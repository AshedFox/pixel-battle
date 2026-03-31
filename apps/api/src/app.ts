import Fastify from 'fastify';
import { config } from './config';
import { dbPlugin } from './plugins/db';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
import fastifyRedis from '@fastify/redis';
import fastifyWebsocket from '@fastify/websocket';
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';
import { authPlugin } from './plugins/auth';
import { authRoutes } from './routes/auth';
import { usersRoutes } from './routes/users';
import { redisSubPlugin } from './plugins/redis-sub';
import { canvasPlugin } from './plugins/canvas';
import { canvasRoutes } from './routes/canvas';
import { canvasWsRoute } from './routes/canvas/ws';
import { healthRoutes } from './routes/health';

export function buildApp() {
  const app = Fastify({
    logger: true,
    disableRequestLogging: config.NODE_ENV !== 'development',
  }).withTypeProvider<ZodTypeProvider>();

  app.register(healthRoutes, { prefix: '/api' });

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.register(fastifyJwt, {
    secret: config.JWT_SECRET,
  });
  app.register(fastifyCookie, {
    secret: config.COOKIE_SECRET,
  });
  app.register(dbPlugin);
  app.register(authPlugin);

  app.register(fastifyRedis, {
    url: config.REDIS_URL,
    maxRetriesPerRequest: 1,
    connectTimeout: 2000,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 2) {
        return null;
      }
      return Math.min(times * 200, 1000);
    },
  });
  app.register(redisSubPlugin);

  app.register(canvasPlugin);

  app.register(fastifyWebsocket);

  app.register(authRoutes, { prefix: '/api/auth' });
  app.register(usersRoutes, { prefix: '/api/users' });
  app.register(canvasRoutes, { prefix: '/api/canvas' });
  app.register(canvasWsRoute, { prefix: '/api/canvas' });

  return app;
}

async function start() {
  const app = buildApp();
  try {
    await app.listen({ port: 3000 });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
