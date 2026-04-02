import { ErrorResponse } from '../common';
import { PixelsUpdateData, PixelUpdateData } from '../canvas/types';

export type WsClientMessage = {
  type: 'setPixel';
  data: PixelUpdateData;
};

type WsServerMessageWrapper<T extends string, D> = {
  seq?: number;
  type: T;
  data: D;
};

export type WsServerMessage =
  | WsServerMessageWrapper<'pixelUpdated', PixelUpdateData>
  | WsServerMessageWrapper<'pixelsUpdated', PixelsUpdateData>
  | WsServerMessageWrapper<'onlineCount', number>
  | { type: 'error'; data: ErrorResponse };
