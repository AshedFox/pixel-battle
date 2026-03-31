import z from 'zod';
import {
  cooldownResponseSchema,
  pixelsUpdateSchema,
  pixelUpdateSchema,
} from './schemas';

export type PixelUpdateData = z.infer<typeof pixelUpdateSchema>;
export type PixelsUpdateData = z.infer<typeof pixelsUpdateSchema>;
export type CooldownResponse = z.infer<typeof cooldownResponseSchema>;
