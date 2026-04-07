import { useEffect, useRef, useCallback, useState } from 'react';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@repo/shared';
import { Viewport } from './useViewport';
import { apiFetch } from '@/lib/api-client';
import { decodeEvents } from '@/lib/binary';

type Props = {
  heatmapRef: React.RefObject<HTMLCanvasElement | null>;
  viewportRef: React.RefObject<Viewport>;
  historyMinutes?: number;
};

const SCALE_FACTOR = 5;
const HEAT_WIDTH = Math.floor(CANVAS_WIDTH / SCALE_FACTOR);
const HEAT_HEIGHT = Math.floor(CANVAS_HEIGHT / SCALE_FACTOR);
const HALF_LIFE_MS = 2 * 60 * 1000;
const LAMBDA = Math.LN2 / HALF_LIFE_MS;
const MAX_HEAT = 5;

export const useHeatmap = ({
  heatmapRef,
  viewportRef,
  historyMinutes = 5,
}: Props) => {
  const offscreen = useRef<HTMLCanvasElement | null>(null);
  const offscreenCtx = useRef<CanvasRenderingContext2D | null>(null);

  const intensities = useRef<Float32Array>(
    new Float32Array(HEAT_WIDTH * HEAT_HEIGHT),
  );
  const lastUpdateTimes = useRef<Float64Array>(
    new Float64Array(HEAT_WIDTH * HEAT_HEIGHT),
  );

  const [isEnabled, setIsEnabled] = useState<boolean>(false);

  const hasLoadedData = useRef(false);
  const isEnabledRef = useRef(false);

  useEffect(() => {
    isEnabledRef.current = isEnabled;
  }, [isEnabled]);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = HEAT_WIDTH;
    canvas.height = HEAT_HEIGHT;
    offscreen.current = canvas;
    offscreenCtx.current = canvas.getContext('2d', {
      willReadFrequently: true,
    });
  }, []);

  const draw = useCallback(() => {
    const canvas = heatmapRef.current;
    const ctx = canvas?.getContext('2d');

    ctx?.clearRect(0, 0, canvas?.width ?? 0, canvas?.height ?? 0);

    if (
      !ctx ||
      !offscreenCtx.current ||
      !offscreen.current ||
      !isEnabledRef.current
    ) {
      return;
    }

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.filter = 'blur(2px)';

    const { offsetX, offsetY, scale } = viewportRef.current;

    ctx.drawImage(
      offscreen.current,
      offsetX,
      offsetY,
      CANVAS_WIDTH * scale,
      CANVAS_HEIGHT * scale,
    );
    ctx.restore();
  }, [heatmapRef, viewportRef]);

  const processDecay = useCallback(() => {
    if (!offscreenCtx.current || !isEnabledRef.current) {
      return;
    }

    const now = Date.now();
    const imgData = new ImageData(HEAT_WIDTH, HEAT_HEIGHT);

    for (let i = 0; i < intensities.current.length; i++) {
      const heat = intensities.current[i];

      if (heat > 0.01) {
        const dt = now - lastUpdateTimes.current[i];
        const currentHeat = heat * Math.exp(-LAMBDA * dt);

        intensities.current[i] = currentHeat;
        lastUpdateTimes.current[i] = now;

        const ratio = Math.min(currentHeat / MAX_HEAT, 1);
        const offset = i * 4;

        imgData.data[offset] = ratio * 255;
        imgData.data[offset + 1] = ratio > 0.7 ? (ratio - 0.7) * 255 : 0;
        imgData.data[offset + 2] = (1 - ratio) * 100 * (ratio > 0 ? 1 : 0);
        imgData.data[offset + 3] = ratio * 200;
      }
    }

    offscreenCtx.current.putImageData(imgData, 0, 0);
    draw();
  }, [draw]);

  const addPoint = useCallback(
    (x: number, y: number, timestampMs: number = Date.now()) => {
      const hX = Math.floor(x / SCALE_FACTOR);
      const hY = Math.floor(y / SCALE_FACTOR);

      if (hX < 0 || hX >= HEAT_WIDTH || hY < 0 || hY >= HEAT_HEIGHT) {
        return;
      }

      const idx = hY * HEAT_WIDTH + hX;
      const dt = timestampMs - (lastUpdateTimes.current[idx] || timestampMs);
      const decayed = intensities.current[idx] * Math.exp(-LAMBDA * dt);

      intensities.current[idx] = decayed + 1;
      lastUpdateTimes.current[idx] = timestampMs;
    },
    [],
  );

  const loadInitialData = useCallback(async () => {
    if (hasLoadedData.current) {
      return;
    }

    hasLoadedData.current = true;

    try {
      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - historyMinutes);

      const res = await apiFetch(
        `/api/canvas/events/after/${pastDate.toISOString()}`,
      );

      if (!res.ok) {
        return;
      }

      const buffer = await res.arrayBuffer();
      const events = decodeEvents(buffer);

      for (const event of events) {
        addPoint(event.x, event.y, new Date(event.timestamp).getTime());
      }

      processDecay();
    } catch (e) {
      hasLoadedData.current = false;
      console.error('Failed to fetch heatmap data', e);
    }
  }, [addPoint, historyMinutes, processDecay]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  useEffect(() => {
    draw();

    if (isEnabled) {
      processDecay();
    }
  }, [draw, isEnabled, processDecay]);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }
    const interval = setInterval(processDecay, 1000);

    return () => clearInterval(interval);
  }, [isEnabled, processDecay]);

  const toggleHeatmap = useCallback(() => {
    setIsEnabled((en) => !en);
    draw();
  }, [draw]);

  return {
    addHeatPoint: (x: number, y: number) => addPoint(x, y),
    redrawHeatmap: draw,
    toggleHeatmap,
    isEnabled,
  };
};
