import Fastify from 'fastify';
import { config } from './config';
import dbPlugin from './plugins/db';
import fastifyJwt from '@fastify/jwt';
import fastifyCookie from '@fastify/cookie';
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
  app.register(fastifyJwt, {
    secret: config.JWT_SECRET,
  });
  app.register(fastifyCookie, {
    secret: config.COOKIE_SECRET,
  });
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
