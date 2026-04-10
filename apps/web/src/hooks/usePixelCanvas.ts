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
  MAX_FILL_AREA,
} from '@repo/shared';
import { useAuth } from '@/components/AuthProvider';
import { Pixel } from '@/types/pixel';
import { apiFetch } from '@/lib/api-client';
import { Selection } from './useDrawRect';
import { toast } from 'sonner';

type Props = {
  initialData: Uint8Array;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  viewportRef: React.RefObject<Viewport>;
  selectedColorIndex: number;
  pendingPixel: Pixel | null;
  selectionRef?: React.RefObject<Selection | null>;
  onOnlineChange?: (newCount: number) => void;
  onCooldownUpdate?: (availableAt: string | null) => void;
  onPixelUpdate?: (x: number, y: number) => void;
};

const WS_API_URL = import.meta.env.VITE_API_WS_URL;

export const usePixelCanvas = ({
  initialData,
  canvasRef,
  selectedColorIndex,
  viewportRef,
  pendingPixel,
  selectionRef,
  onOnlineChange,
  onCooldownUpdate,
  onPixelUpdate,
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
      selectionRef,
    });

  const { authData } = useAuth();

  const lastSeqRef = useRef(0);
  const lastSyncRef = useRef(0);

  const syncCanvas = useCallback(async () => {
    const now = Date.now();

    if (now - lastSyncRef.current < 5_000) {
      return;
    }

    lastSyncRef.current = now;

    const res = await apiFetch('/api/canvas');
    const buf = await res.arrayBuffer();
    const data = new Uint8Array(buf);

    pixelDataRef.current = data;
    rebuildImageData(data);
    scheduleRedraw();
  }, [pixelDataRef, rebuildImageData, scheduleRedraw]);

  const handleWsMessage = useCallback(
    (msg: unknown) => {
      const parsed = msg as WsServerMessage;
      const { type, data } = parsed;

      if (
        type === 'pixelUpdated' ||
        type === 'pixelsUpdated' ||
        type === 'onlineCount' ||
        type === 'rectDrawn'
      ) {
        const seq = parsed.seq;

        if (typeof seq === 'number') {
          if (
            seq > 0 &&
            lastSeqRef.current > 0 &&
            seq !== lastSeqRef.current + 1
          ) {
            void syncCanvas();
          }

          lastSeqRef.current = seq;
        }
      }

      if (type === 'pixelUpdated') {
        applyPixel(data.x, data.y, data.color);
        writePixelToImageData(data.x, data.y, data.color);
        onPixelUpdate?.(data.x, data.y);
        scheduleRedraw();
      } else if (type === 'pixelsUpdated') {
        for (const { x, y, color } of data) {
          if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) {
            continue;
          }
          applyPixel(x, y, color);
          writePixelToImageData(x, y, color);
          onPixelUpdate?.(x, y);
        }
        scheduleRedraw();
      } else if (type === 'rectDrawn') {
        const { x, y, width, height, color } = data;

        for (let dx = 0; dx < width; dx++) {
          for (let dy = 0; dy < height; dy++) {
            const curX = x + dx;
            const curY = y + dy;

            if (
              curX < 0 ||
              curX >= CANVAS_WIDTH ||
              curY < 0 ||
              curY >= CANVAS_HEIGHT
            ) {
              continue;
            }

            applyPixel(curX, curY, color);
            writePixelToImageData(curX, curY, color);
          }
        }
        scheduleRedraw();
      } else if (type === 'onlineCount') {
        onOnlineChange?.(data);
      } else if (type === 'cooldownUpdate') {
        onCooldownUpdate?.(data.availableAt);
      }
    },
    [
      syncCanvas,
      onPixelUpdate,
      applyPixel,
      writePixelToImageData,
      scheduleRedraw,
      onOnlineChange,
      onCooldownUpdate,
    ],
  );

  const { send } = useWebSocket({
    url: `${WS_API_URL}/api/canvas/ws`,
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

  const drawRect = useCallback(
    (x: number, y: number, width: number, height: number) => {
      if (width * height > MAX_FILL_AREA) {
        toast.error(
          `Selected rectangle is too big (max area ${MAX_FILL_AREA})`,
        );
        return;
      }

      const color = selectedColorRef.current;

      for (let dy = 0; dy < height; dy++) {
        for (let dx = 0; dx < width; dx++) {
          applyPixel(x + dx, y + dy, color);
          writePixelToImageData(x + dx, y + dy, color);
        }
      }

      scheduleRedraw();
      send({
        type: 'drawRect',
        data: { x, y, width, height, color },
      } satisfies WsClientMessage);
    },
    [applyPixel, writePixelToImageData, scheduleRedraw, send, selectedColorRef],
  );

  return { placePixel, scheduleRedraw, getPixelColor, drawRect };
};
