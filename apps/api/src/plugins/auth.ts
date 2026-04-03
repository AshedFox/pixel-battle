import { accessTokenErrorSchema } from '@repo/shared';
import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import z from 'zod';
import { UserJwtPayload } from '../shared/auth/types';

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
    payload: UserJwtPayload;
    user: UserJwtPayload;
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
        const payload = await request.jwtVerify<UserJwtPayload>();

        if (payload.status !== 'CONFIRMED') {
          reply.code(401).send({
            message: 'Invalid status',
            code: 'UNAUTHORIZED',
          } satisfies AccessError);
        }
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
