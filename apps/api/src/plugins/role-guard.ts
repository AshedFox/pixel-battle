import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { UserRole } from '../db/schema/users';

declare module 'fastify' {
  interface FastifyInstance {
    roleGuard: (
      ...acceptableRoles: UserRole[]
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export const roleGuardPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.decorate(
    'roleGuard',
    (...acceptableRoles: UserRole[]) =>
      async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.user) {
          return reply.code(401).send({ message: 'Unauthorized' });
        }

        if (!acceptableRoles.includes(request.user.role)) {
          return reply.code(403).send({ message: 'Forbidden' });
        }
      },
    ['authenticate'],
  );
});
