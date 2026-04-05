import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { CanvasService } from '../shared/canvas/canvas.service';
import { CanvasBatchService } from '../shared/canvas/canvas-batch.service';
import { PixelHistoryService } from '../shared/canvas/pixel-history.service';
import cron from 'node-cron';
import { config } from '../config';

declare module 'fastify' {
  interface FastifyInstance {
    canvas: {
      service: CanvasService;
      batchService: CanvasBatchService;
    };
  }
}

export const canvasPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const pixelHistory = new PixelHistoryService(fastify.db);

  const canvasService = new CanvasService(fastify.redis, fastify.db);
  const canvasBatchService = new CanvasBatchService(fastify.redis, (events) =>
    pixelHistory.saveBatch(events),
  );

  fastify.decorate('canvas', {
    service: canvasService,
    batchService: canvasBatchService,
  });

  await canvasService.initIfEmpty();
  await canvasBatchService.ensureGroup();
  await canvasBatchService.recoverProcessing();
  canvasBatchService.start();

  const cronTask = cron.schedule('* * * * *', async () => {
    const lockKey = 'lock:canvas:snapshot';
    const acquired = await fastify.redis.set(lockKey, 'true', 'EX', 60, 'NX');

    if (!acquired) {
      return;
    }

    try {
      const snapshot = await canvasService.getLastSnapshot();
      const lastTimestamp = snapshot?.timestamp ?? new Date(0);
      const { count: eventsCount } =
        await canvasService.getEventsCountSince(lastTimestamp);

      if (eventsCount < config.CANVAS_SNAPSHOT_THRESHOLD) {
        return;
      }

      const state = await canvasService.getFullState();
      await canvasService.saveSnapshot(state);

      fastify.log.info({ eventsCount }, 'Canvas snapshot saved successfully');
    } catch (err) {
      fastify.log.error(err, 'Failed to save canvas snapshot');
    } finally {
      await fastify.redis.del(lockKey);
    }
  });

  fastify.addHook('onClose', async () => {
    cronTask.stop();
    await canvasBatchService.stop();
  });
});
