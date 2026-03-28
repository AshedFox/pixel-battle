import 'dotenv/config';
import z from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_LIFETIME: z.coerce.number(),
  COOKIE_SECRET: z.string(),
  REFRESH_COOKIE_NAME: z.string().default('X-REFRESH-TOKEN'),
  AUTH_HINT_COOKIE_NAME: z.string().default('is_auth'),
  REFRESH_TOKEN_SECRET: z.string(),
  REFRESH_TOKEN_LIFETIME: z.coerce.number().min(60000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
});

export const config = envSchema.parse(process.env);
