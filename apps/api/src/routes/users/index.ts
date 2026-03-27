import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { users } from '../../db/schema/users';
import { eq } from 'drizzle-orm';

export const usersRoutes: FastifyPluginAsyncZod = async (fastify) => {
  fastify.get('/me', { preHandler: fastify.authenticate }, (request, reply) => {
    const user = fastify.db
      .select()
      .from(users)
      .where(eq(users.id, request.user.sub));

    if (!user) {
      return reply.code(404).send({ message: 'User not found' });
    }

    reply.code(200).send({ user });
  });
};
