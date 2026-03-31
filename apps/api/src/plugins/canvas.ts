import { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { CanvasService } from '../shared/canvas/canvas.service';
import { CanvasBatchService } from '../shared/canvas/canvas-batch.service';

declare module 'fastify' {
  interface FastifyInstance {
    canvas: {
      service: CanvasService;
      batchService: CanvasBatchService;
    };
  }
}

export const canvasPlugin: FastifyPluginAsync = fp(async (fastify) => {
  const canvasService = new CanvasService(fastify.redis);
  const canvasBatchService = new CanvasBatchService(fastify.db, fastify.redis);

  fastify.decorate('canvas', {
    service: canvasService,
    batchService: canvasBatchService,
  });

  await canvasService.initIfEmpty();
  await canvasBatchService.recoverProcessing();
  canvasBatchService.start();

  fastify.addHook('onClose', async () => {
    await canvasBatchService.stop();
  });
});
