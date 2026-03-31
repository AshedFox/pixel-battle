import { useEffect, useRef, useCallback } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT, CANVAS_COLORS_RGB } from '@repo/shared';
import { Viewport } from './useViewport';
import { Pixel } from '@/types/pixel';

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  viewportRef: React.RefObject<Viewport>;
  pendingPixelRef: React.RefObject<Pixel | null>;
  selectedColorRef: React.RefObject<number>;
};

export const useCanvasRenderer = ({
  canvasRef,
  viewportRef,
  pendingPixelRef,
  selectedColorRef,
}: Props) => {
  const offscreen = useRef<HTMLCanvasElement | null>(null);
  const offscreenCtx = useRef<CanvasRenderingContext2D | null>(null);
  const imageData = useRef<ImageData | null>(null);
  const imageDataDirty = useRef(false);
  const rafPending = useRef(false);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d')!;
    offscreen.current = canvas;
    offscreenCtx.current = ctx;
    imageData.current = ctx.createImageData(CANVAS_WIDTH, CANVAS_HEIGHT);
    imageData.current.data.fill(255);
    imageDataDirty.current = true;
  }, []);

  const writePixelToImageData = useCallback(
    (x: number, y: number, color: number) => {
      if (!imageData.current) {
        return;
      }

      const [r, g, b] = CANVAS_COLORS_RGB[color];
      const offset = (y * CANVAS_WIDTH + x) * 4;
      const data = imageData.current.data;

      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = 255;

      imageDataDirty.current = true;
    },
    [],
  );

  const rebuildImageData = useCallback((buffer: Uint8Array) => {
    if (!imageData.current) {
      return;
    }

    const data = imageData.current.data;

    for (let i = 0; i < buffer.length; i++) {
      const [r, g, b] = CANVAS_COLORS_RGB[buffer[i]];
      const offset = i * 4;
      data[offset] = r;
      data[offset + 1] = g;
      data[offset + 2] = b;
      data[offset + 3] = 255;
    }

    imageDataDirty.current = true;
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (
      !ctx ||
      !offscreenCtx.current ||
      !imageData.current ||
      !offscreen.current
    ) {
      return;
    }

    if (imageDataDirty.current) {
      offscreenCtx.current.putImageData(imageData.current, 0, 0);
      imageDataDirty.current = false;
    }

    ctx.clearRect(0, 0, canvas?.width ?? 0, canvas?.height ?? 0);
    ctx.imageSmoothingEnabled = false;

    const { offsetX, offsetY, scale } = viewportRef.current;
    ctx.drawImage(
      offscreen.current,
      offsetX,
      offsetY,
      CANVAS_WIDTH * scale,
      CANVAS_HEIGHT * scale,
    );

    if (scale >= 5) {
      drawGrid(
        ctx,
        offsetX,
        offsetY,
        scale,
        canvas?.width ?? 0,
        canvas?.height ?? 0,
      );
    }

    const pending = pendingPixelRef.current;

    if (pending) {
      const px = offsetX + pending.x * scale;
      const py = offsetY + pending.y * scale;
      const size = Math.max(scale, 4);
      const nudge = (size - scale) / 2;
      const [r, g, b] = CANVAS_COLORS_RGB[selectedColorRef.current];

      ctx.fillStyle = `rgba(${r},${g},${b},0.8)`;
      ctx.fillRect(px - nudge, py - nudge, size, size);

      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px - nudge, py - nudge, size, size);

      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(px - nudge - 1.5, py - nudge - 1.5, size + 3, size + 3);
    }
  }, [canvasRef, viewportRef, pendingPixelRef, selectedColorRef]);

  const scheduleRedraw = useCallback(() => {
    if (rafPending.current) {
      return;
    }

    rafPending.current = true;

    requestAnimationFrame(() => {
      draw();
      rafPending.current = false;
    });
  }, [draw]);

  return { scheduleRedraw, writePixelToImageData, rebuildImageData };
};

function drawGrid(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  scale: number,
  width: number,
  height: number,
) {
  ctx.strokeStyle = 'rgba(0,0,0,0.15)';
  ctx.lineWidth = 0.5;
  const startX = Math.floor(-offsetX / scale);
  const startY = Math.floor(-offsetY / scale);
  const endX = Math.ceil((width - offsetX) / scale);
  const endY = Math.ceil((height - offsetY) / scale);

  ctx.beginPath();

  for (let x = startX; x <= endX; x++) {
    const sx = offsetX + x * scale;
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx, height);
  }

  for (let y = startY; y <= endY; y++) {
    const sy = offsetY + y * scale;
    ctx.moveTo(0, sy);
    ctx.lineTo(width, sy);
  }

  ctx.stroke();
}
