import { FastifyPluginAsync } from 'fastify';
import { cooldownResponseSchema } from '@repo/shared';

export const canvasRoutes: FastifyPluginAsync = async (fastify) => {
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
};
