import { FastifyPluginAsync } from 'fastify';
import {
  cooldownResponseSchema,
  PixelInfoParams,
  pixelInfoParamsSchema,
  pixelInfoResponseSchema,
} from '@repo/shared';
import { PixelHistoryService } from '../../shared/canvas/pixel-history.service';

export const canvasRoutes: FastifyPluginAsync = async (fastify) => {
  const pixelHistoryService = new PixelHistoryService(fastify.db);

  fastify.get('/', { preHandler: fastify.authenticate }, async (_, reply) => {
    const state = await fastify.canvas.service.getFullState();

    return reply
      .code(200)
      .header('Content-Type', 'application/octet-stream')
      .send(state);
  });

  fastify.get(
    '/cooldown',
    {
      preHandler: fastify.authenticate,
      schema: { response: { 200: cooldownResponseSchema } },
    },
    async (request, reply) => {
      const cooldown = await fastify.canvas.service.getUserCooldown(
        request.user.sub,
      );

      return reply
        .code(200)
        .send({ availableAt: cooldown ? cooldown.toISOString() : null });
    },
  );

  fastify.get<{ Params: PixelInfoParams }>(
    '/:x/:y',
    {
      preHandler: fastify.authenticate,
      schema: {
        params: pixelInfoParamsSchema,
        response: { 200: pixelInfoResponseSchema },
      },
    },
    async (request, reply) => {
      const pixelState = await pixelHistoryService.getLastPixelState(
        request.params.x,
        request.params.y,
      );

      return reply.code(200).send({
        x: request.params.x,
        y: request.params.y,
        color: pixelState?.color ?? null,
        userId: pixelState?.userId ?? null,
        userName: pixelState?.userName ?? null,
        timestamp: pixelState ? pixelState.timestamp.toISOString() : null,
      });
    },
  );
};
