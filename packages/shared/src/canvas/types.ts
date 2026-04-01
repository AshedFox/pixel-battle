import z from 'zod';
import {
  cooldownResponseSchema,
  pixelInfoParamsSchema,
  pixelInfoResponseSchema,
  pixelsUpdateSchema,
  pixelUpdateSchema,
} from './schemas';

export type PixelUpdateData = z.infer<typeof pixelUpdateSchema>;
export type PixelsUpdateData = z.infer<typeof pixelsUpdateSchema>;
export type CooldownResponse = z.infer<typeof cooldownResponseSchema>;
export type PixelInfoParams = z.infer<typeof pixelInfoParamsSchema>;
export type PixelInfoResponse = z.infer<typeof pixelInfoResponseSchema>;
