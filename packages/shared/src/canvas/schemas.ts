import z from 'zod';
import { CANVAS_COLORS, CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';

export const pixelUpdateSchema = z.object({
  x: z
    .int32()
    .min(0)
    .max(CANVAS_WIDTH - 1),
  y: z
    .int32()
    .min(0)
    .max(CANVAS_HEIGHT - 1),
  color: z
    .int32()
    .min(0)
    .max(CANVAS_COLORS.length - 1),
});

export const pixelsUpdateSchema = z.array(pixelUpdateSchema);

export const cooldownResponseSchema = z.object({
  availableAt: z.iso.datetime().nullable(),
});
