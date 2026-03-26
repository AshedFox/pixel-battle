import Fastify from 'fastify';

export function buildApp() {
  const app = Fastify({ logger: true });

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
