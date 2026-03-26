import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { createDatabase, Database } from '../db';

declare module 'fastify' {
  interface FastifyInstance {
    db: Database['db'];
  }
}

const dbPlugin: FastifyPluginAsync = fp(async (app) => {
  const { db, pool } = createDatabase();

  app.decorate('db', db);

  app.addHook('onClose', async () => {
    await pool.end();
    app.log.info('Database pool closed');
  });
});

export default dbPlugin;
