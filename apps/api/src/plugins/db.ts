import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { createDatabase, Database } from '../db';

declare module 'fastify' {
  interface FastifyInstance {
    db: Database['db'];
  }
}

export const dbPlugin: FastifyPluginAsync = fp(async (app) => {
  try {
    app.log.info('Connecting to PostgreSQL...');

    const { db, pool } = await createDatabase();

    app.decorate('db', db);
    app.log.info('PostgreSQL connected successfully');

    app.addHook('onClose', async () => {
      await pool.end();
      app.log.info('Database pool closed');
    });
  } catch (err) {
    app.log.error('Failed to connect to PostgreSQL');
    throw err;
  }
});
