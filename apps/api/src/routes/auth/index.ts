import {
  errorSchema,
  loginBodySchema,
  loginResponseSchema,
  refreshResponseSchema,
  registerBodySchema,
} from '@repo/shared';
import { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { config } from '../../config';
import { AuthService } from './auth.service';
import fastifyRateLimit from '@fastify/rate-limit';
import z from 'zod';
import { EmailConfirmationService } from '../../shared/email-confirmation/email-confirmation.service';

const cookieOptions = (maxAgeMs: number) => ({
  httpOnly: true,
  secure: config.NODE_ENV === 'production',
  maxAge: Math.floor(maxAgeMs / 1000),
  path: '/',
});

const publicCookieOptions = (maxAgeMs: number) => ({
  httpOnly: false,
  secure: config.NODE_ENV === 'production',
  maxAge: Math.floor(maxAgeMs / 1000),
  path: '/',
});

export const authRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const authService = new AuthService(fastify.db, fastify.jwt, fastify.redis);
  const confirmationService = new EmailConfirmationService(
    fastify.jwt,
    fastify.db,
  );

  fastify.register(fastifyRateLimit, {
    max: 10,
    timeWindow: '1 minute',
    keyGenerator: (req) => req.ip,
  });

  fastify.post(
    '/login',
    {
      schema: {
        body: loginBodySchema,
        response: { 200: loginResponseSchema, 401: errorSchema },
      },
    },
    async (request, reply) => {
      const user = await authService.verifyCredentials(
        request.body.email,
        request.body.password,
      );

      if (!user || user.status === 'UNCONFIRMED') {
        return reply.code(401).send({ message: 'Failed to login' });
      }

      const { accessToken, refreshToken, expiresAt } =
        await authService.makeTokens(
          { sub: user.id, status: user.status },
          request.ip,
        );

      reply.setCookie(
        config.REFRESH_COOKIE_NAME,
        refreshToken,
        cookieOptions(config.REFRESH_TOKEN_LIFETIME),
      );

      reply.setCookie(
        config.AUTH_HINT_COOKIE_NAME,
        '1',
        publicCookieOptions(config.REFRESH_TOKEN_LIFETIME),
      );

      return reply
        .code(200)
        .send({ accessToken, expiresAt: expiresAt.toISOString() });
    },
  );

  fastify.post(
    '/register',
    {
      schema: {
        body: registerBodySchema,
        response: { 204: z.void(), 401: errorSchema },
      },
    },
    async (request, reply) => {
      const user = await authService.registerUser(
        request.body.email,
        request.body.password,
        request.body.name,
      );

      if (!user) {
        return reply.code(401).send({ message: 'Failed to register' });
      }

      const confirmation = confirmationService.createConfirmationToken({
        sub: user.id,
      });

      await fastify.mailer.sendMail({
        template: 'welcome',
        to: request.body.email,
        data: {
          username: request.body.name,
          confirmUrl: `${config.CLIENT_URL}/confirm-email/${confirmation}`,
          appName: config.APP_NAME,
        },
      });

      return reply.status(204).send();
    },
  );

  fastify.post(
    '/refresh',
    {
      schema: {
        response: {
          400: errorSchema,
          401: errorSchema,
          200: refreshResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const token = request.cookies[config.REFRESH_COOKIE_NAME];

      if (!token) {
        return reply.code(400).send({ message: 'No refresh token' });
      }

      const tokens = await authService.rotateTokens(token, request.ip);

      if (!tokens) {
        reply.clearCookie(config.REFRESH_COOKIE_NAME, cookieOptions(-1));
        reply.clearCookie(
          config.AUTH_HINT_COOKIE_NAME,
          publicCookieOptions(-1),
        );
        return reply.code(401).send({ message: 'Failed to refresh' });
      }

      const { accessToken, refreshToken, expiresAt } = tokens;

      reply.setCookie(
        config.REFRESH_COOKIE_NAME,
        refreshToken,
        cookieOptions(config.REFRESH_TOKEN_LIFETIME),
      );

      reply.setCookie(
        config.AUTH_HINT_COOKIE_NAME,
        '1',
        publicCookieOptions(config.REFRESH_TOKEN_LIFETIME),
      );

      return reply
        .status(200)
        .send({ accessToken, expiresAt: expiresAt.toISOString() });
    },
  );

  fastify.post(
    '/logout',
    {
      schema: {
        response: { 400: errorSchema, 401: errorSchema, 204: z.void() },
      },
    },
    async (request, reply) => {
      const token = request.cookies[config.REFRESH_COOKIE_NAME];

      if (!token) {
        return reply.code(400).send({ message: 'No token' });
      }

      const success = await authService.invalidateRefresh(token);

      if (!success) {
        return reply.code(401).send({ message: 'Failed to logout' });
      }

      reply.clearCookie(config.REFRESH_COOKIE_NAME, cookieOptions(-1));
      reply.clearCookie(config.AUTH_HINT_COOKIE_NAME, publicCookieOptions(-1));

      return reply.status(204).send();
    },
  );
};
