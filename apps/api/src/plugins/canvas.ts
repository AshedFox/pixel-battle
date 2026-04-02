import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { CanvasService } from '../shared/canvas/canvas.service';
import { CanvasBatchService } from '../shared/canvas/canvas-batch.service';
import { PixelHistoryService } from '../shared/canvas/pixel-history.service';

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

  const canvasService = new CanvasService(fastify.redis);
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

  fastify.addHook('onClose', async () => {
    await canvasBatchService.stop();
  });
});
