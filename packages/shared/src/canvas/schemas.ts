import z from 'zod';
import {
  CANVAS_COLORS,
  CANVAS_HEIGHT,
  CANVAS_WIDTH,
  MAX_FILL_AREA,
} from './constants';

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

export const drawRectSchema = z
  .object({
    x: z
      .int32()
      .min(0)
      .max(CANVAS_WIDTH - 1),
    y: z
      .int32()
      .min(0)
      .max(CANVAS_HEIGHT - 1),
    width: z.int32().min(1),
    height: z.int32().min(1),
    color: z
      .int32()
      .min(0)
      .max(CANVAS_COLORS.length - 1),
  })
  .refine(
    ({ x, width, y, height }) => {
      return x + width <= CANVAS_WIDTH && y + height <= CANVAS_HEIGHT;
    },
    {
      path: ['x', 'width', 'y', 'height'],
      error: 'Rectangle is out of canvas borders',
    },
  )
  .refine(
    ({ height, width }) => {
      return height * width <= MAX_FILL_AREA;
    },
    {
      path: ['width', 'height'],
      error: `Rectanпle is too big (max area: ${MAX_FILL_AREA})`,
    },
  );

export const cooldownSchema = z.object({
  availableAt: z.iso.datetime().nullable(),
});

export const cooldownResponseSchema = cooldownSchema.extend({
  cooldownMs: z.number().int().min(0),
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

export const canvasEventsParamsSchema = z.object({
  timestamp: z.iso.datetime(),
});

export const canvasEventSchema = z.object({
  x: z.int(),
  y: z.int(),
  color: z.int(),
  timestamp: z.int(),
});
