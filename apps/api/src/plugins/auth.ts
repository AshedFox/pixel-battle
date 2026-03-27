import { accessTokenErrorSchema } from '@repo/shared';
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import z from 'zod';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}

function isJwtError(err: unknown): err is { code?: string } {
  return typeof err === 'object' && err !== null && 'code' in err;
}

type AccessError = z.infer<typeof accessTokenErrorSchema>;

export const authPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.decorate(
    'authenticate',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await request.jwtVerify();
      } catch (err: unknown) {
        if (
          isJwtError(err) &&
          err?.code === 'FST_JWT_AUTHORIZATION_TOKEN_EXPIRED'
        ) {
          return reply.code(401).send({
            message: 'Failed to authenticate',
            code: 'ACCESS_TOKEN_EXPIRED',
          } satisfies AccessError);
        }

        return reply.code(401).send({
          message: 'Failed to authenticate',
          code: 'UNAUTHORIZED',
        } satisfies AccessError);
      }
    },
  );
});
