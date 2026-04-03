import fp from 'fastify-plugin';
import { config } from '../config';
import IORedis from 'ioredis';
import { MailerService } from '../shared/mailer/mailer.service';

declare module 'fastify' {
  interface FastifyInstance {
    mailer: MailerService;
  }
}

export const mailerPlugin = fp(async (fastify) => {
  const connectionQueue = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
  });
  const connectionWorker = new IORedis(config.REDIS_URL, {
    maxRetriesPerRequest: null,
  });

  const mailerService = new MailerService(connectionQueue, connectionWorker);

  mailerService.worker.on('failed', (job, err) => {
    fastify.log.error(
      { err, jobId: job?.id },
      'Mailer worker failed to process job',
    );
  });

  fastify.decorate('mailer', mailerService);

  fastify.addHook('onClose', async () => {
    await mailerService.queue.close();
    await mailerService.worker.close();
    connectionQueue.disconnect();
    connectionWorker.disconnect();
  });
});
