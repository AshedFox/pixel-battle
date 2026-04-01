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
  PIXEL_COOLDOWN_MS: z.coerce.number().min(0),
  REDIS_URL: z.string(),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  CANVAS_FLUSH_INTERVAL: z.coerce.number().default(100),
  CANVAS_FLUSH_THRESHOD: z.coerce.number().default(1000),
  PIXEL_UPDATE_FLUSH_INTERVAL: z.coerce.number().default(100),
  WS_BROADCAST_CHUNK: z.coerce.number().default(100),
  ONLINE_HEARTBEAT_INTERVAL: z.coerce.number().default(30000),
});

export const config = envSchema.parse(process.env);
