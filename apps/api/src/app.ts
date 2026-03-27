import Fastify from 'fastify';
import { config } from './config';
import dbPlugin from './plugins/db';
import {
  serializerCompiler,
  validatorCompiler,
  ZodTypeProvider,
} from 'fastify-type-provider-zod';

export function buildApp() {
  const app = Fastify({
    logger: config.NODE_ENV === 'development',
  }).withTypeProvider<ZodTypeProvider>();

  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);
  app.register(dbPlugin);

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
