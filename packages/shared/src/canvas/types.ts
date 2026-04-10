import z from 'zod';
import {
  canvasEventSchema,
  canvasEventsParamsSchema,
  canvasSnapshotParamsSchema,
  cooldownResponseSchema,
  cooldownSchema,
  drawRectSchema,
  pixelInfoParamsSchema,
  pixelInfoResponseSchema,
  pixelsUpdateSchema,
  pixelUpdateSchema,
} from './schemas';

export type PixelUpdateData = z.infer<typeof pixelUpdateSchema>;
export type PixelsUpdateData = z.infer<typeof pixelsUpdateSchema>;
export type DrawRectData = z.infer<typeof drawRectSchema>;
export type CooldownData = z.infer<typeof cooldownSchema>;
export type CooldownResponse = z.infer<typeof cooldownResponseSchema>;
export type PixelInfoParams = z.infer<typeof pixelInfoParamsSchema>;
export type PixelInfoResponse = z.infer<typeof pixelInfoResponseSchema>;
export type CanvasSnapshotParams = z.infer<typeof canvasSnapshotParamsSchema>;
export type CanvasEventsParams = z.infer<typeof canvasEventsParamsSchema>;
export type CanvasEvent = z.infer<typeof canvasEventSchema>;
