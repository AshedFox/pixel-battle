import Fastify from 'fastify';
import { config } from './config';

export function buildApp() {
  const app = Fastify({ logger: config.NODE_ENV === 'development' });

  return app;
}

async function start() {
  const app = buildApp();
  try {
    await app.listen({ port: 3000, host: '0.0.0.0' });
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

start();
