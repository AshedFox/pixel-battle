import z from 'zod';
import { errorSchema } from '../common';
import { ACCESS_TOKEN_ERRORS } from './constants';

const authResponseSchema = z.object({
  accessToken: z.string(),
  expiresAt: z.iso.datetime(),
});

export const loginBodySchema = z.object({
  email: z.email(),
  password: z.string().min(2).max(63),
});

export const loginResponseSchema = authResponseSchema;

export const registerBodySchema = z
  .object({
    email: z.email(),
    password: z
      .string()
      .min(8)
      .max(63)
      .regex(/[a-zA-Z]/, {
        error: 'Password must contain at least one letter.',
      })
      .regex(/[0-9]/, { error: 'Password must contain at least one number.' }),
    passwordComparison: z.string(),
    name: z.string().min(2).max(127),
  })
  .refine((data) => data.password === data.passwordComparison, {
    message: 'Passwords do not match',
    path: ['passwordComparison'],
  });

export const registerResponseSchema = authResponseSchema;

export const refreshResponseSchema = authResponseSchema;

export const accessTokenErrorSchema = errorSchema.extend({
  code: z.enum(ACCESS_TOKEN_ERRORS),
});
