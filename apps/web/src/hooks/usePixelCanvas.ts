import { useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';
import { useCanvasState } from './useCanvasState';
import { useCanvasRenderer } from './useCanvasRenderer';
import { Viewport } from './useViewport';
import {
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  WsClientMessage,
  WsServerMessage,
} from '@repo/shared';
import { useAuth } from '@/components/AuthProvider';
import { Pixel } from '@/types/pixel';

type Props = {
  wsUrl: string;
  apiUrl: string;
  initialData: Uint8Array;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  viewportRef: React.RefObject<Viewport>;
  selectedColorIndex: number;
  pendingPixel: Pixel | null;
  onOnlineChange?: (newCount: number) => void;
};

export const usePixelCanvas = ({
  wsUrl,
  apiUrl,
  initialData,
  canvasRef,
  selectedColorIndex,
  viewportRef,
  pendingPixel,
  onOnlineChange,
}: Props) => {
  const selectedColorRef = useRef(selectedColorIndex);
  selectedColorRef.current = selectedColorIndex;

  const pendingPixelRef = useRef(pendingPixel);
  pendingPixelRef.current = pendingPixel;

  const { pixelDataRef, applyPixel, getPixelColor } = useCanvasState();

  const { scheduleRedraw, writePixelToImageData, rebuildImageData } =
    useCanvasRenderer({
      canvasRef,
      viewportRef,
      pendingPixelRef,
      selectedColorRef,
    });

  const { apiFetch, authData } = useAuth();

  const lastSeqRef = useRef(0);
  const lastSyncRef = useRef(0);

  const syncCanvas = useCallback(async () => {
    const now = Date.now();

    if (now - lastSyncRef.current < 5_000) {
      return;
    }

    lastSyncRef.current = now;

    const res = await apiFetch(apiUrl);
    const buf = await res.arrayBuffer();
    const data = new Uint8Array(buf);

    pixelDataRef.current = data;
    rebuildImageData(data);
    scheduleRedraw();
  }, [apiFetch, apiUrl, pixelDataRef, rebuildImageData, scheduleRedraw]);

  const handleWsMessage = useCallback(
    (msg: unknown) => {
      const parsed = msg as WsServerMessage;
      const { type, data } = parsed;

      if (type !== 'error') {
        const seq = parsed.seq;

        if (typeof seq !== 'number') {
          return;
        }

        if (
          seq > 0 &&
          lastSeqRef.current > 0 &&
          seq !== lastSeqRef.current + 1
        ) {
          void syncCanvas();
        }

        lastSeqRef.current = seq;
      }

      if (type === 'pixelUpdated') {
        applyPixel(data.x, data.y, data.color);
        writePixelToImageData(data.x, data.y, data.color);
        scheduleRedraw();
      } else if (type === 'pixelsUpdated') {
        for (const { x, y, color } of data) {
          if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) {
            continue;
          }
          applyPixel(x, y, color);
          writePixelToImageData(x, y, color);
        }
        scheduleRedraw();
      } else if (type === 'onlineCount') {
        onOnlineChange?.(data);
      }
    },
    [
      syncCanvas,
      applyPixel,
      writePixelToImageData,
      scheduleRedraw,
      onOnlineChange,
    ],
  );

  const { send } = useWebSocket({
    url: wsUrl,
    onMessage: handleWsMessage,
    token: authData?.accessToken ?? null,
  });

  useEffect(() => {
    pixelDataRef.current = initialData;
    rebuildImageData(initialData);
    scheduleRedraw();
  }, [initialData, rebuildImageData, scheduleRedraw, pixelDataRef]);

  const placePixel = useCallback(
    (x: number, y: number) => {
      const color = selectedColorRef.current;
      applyPixel(x, y, color);
      writePixelToImageData(x, y, color);
      scheduleRedraw();

      send({
        type: 'setPixel',
        data: { x, y, color },
      } satisfies WsClientMessage);
    },
    [applyPixel, writePixelToImageData, scheduleRedraw, send],
  );

  return { placePixel, scheduleRedraw, getPixelColor };
};
