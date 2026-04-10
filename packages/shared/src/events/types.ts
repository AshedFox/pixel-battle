import { ErrorResponse } from '../common';
import {
  CooldownData,
  DrawRectData,
  PixelUpdateData,
  PixelsUpdateData,
} from '../canvas';

export type WsClientMessage =
  | {
      type: 'setPixel';
      data: PixelUpdateData;
    }
  | { type: 'drawRect'; data: DrawRectData };

type WsServerMessageWrapper<T extends string, D> = {
  seq?: number;
  type: T;
  data: D;
};

export type WsServerMessage =
  | WsServerMessageWrapper<'pixelUpdated', PixelUpdateData>
  | WsServerMessageWrapper<'pixelsUpdated', PixelsUpdateData>
  | WsServerMessageWrapper<'rectDrawn', DrawRectData>
  | WsServerMessageWrapper<'onlineCount', number>
  | { type: 'cooldownUpdate'; data: CooldownData }
  | { type: 'error'; data: ErrorResponse };
