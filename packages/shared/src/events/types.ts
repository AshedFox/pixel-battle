import { ErrorResponse } from '../common';
import { PixelsUpdateData, PixelUpdateData } from '../canvas/types';

export type WsClientMessage = {
  type: 'setPixel';
  data: PixelUpdateData;
};

export type WsServerMessage =
  | { type: 'pixelUpdated'; data: PixelUpdateData }
  | { type: 'pixelsUpdated'; data: PixelsUpdateData }
  | { type: 'error'; data: ErrorResponse };
