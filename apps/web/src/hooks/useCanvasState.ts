import { CANVAS_HEIGHT, CANVAS_SIZE, CANVAS_WIDTH } from '@repo/shared';
import { useCallback, useRef } from 'react';

export const useCanvasState = () => {
  const pixelDataRef = useRef<Uint8Array>(new Uint8Array(CANVAS_SIZE));

  const applyPixel = useCallback((x: number, y: number, colorIndex: number) => {
    if (x < 0 || x >= CANVAS_WIDTH || y < 0 || y >= CANVAS_HEIGHT) {
      return;
    }

    pixelDataRef.current[y * CANVAS_WIDTH + x] = colorIndex;
  }, []);

  const getPixelColor = useCallback((x: number, y: number): number => {
    return pixelDataRef.current[y * CANVAS_WIDTH + x];
  }, []);

  return { pixelDataRef, getPixelColor, applyPixel };
};
