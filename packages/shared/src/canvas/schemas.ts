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

export const pixelInfoParamsSchema = z.object({
  x: z.coerce
    .number()
    .int()
    .min(0)
    .max(CANVAS_WIDTH - 1),
  y: z.coerce
    .number()
    .int()
    .min(0)
    .max(CANVAS_HEIGHT - 1),
});

export const pixelInfoResponseSchema = z.object({
  x: z.int32(),
  y: z.int32(),
  color: z.int32().nullable(),
  timestamp: z.iso.datetime().nullable(),
  userId: z.string().nullable(),
  userName: z.string().nullable(),
});

export const canvasSnapshotParamsSchema = z.object({
  timestamp: z.iso.datetime(),
});
