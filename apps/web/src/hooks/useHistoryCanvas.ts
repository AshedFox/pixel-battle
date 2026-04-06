import { useCallback, useRef, useState } from 'react';
import { useCanvasState } from './useCanvasState';
import { useCanvasRenderer } from './useCanvasRenderer';
import { Viewport } from './useViewport';
import { Pixel } from '@/types/pixel';
import { apiFetch } from '@/lib/api-client';
import { toast } from 'sonner';

type Props = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  viewportRef: React.RefObject<Viewport>;
};

export const useHistoryCanvas = ({ canvasRef, viewportRef }: Props) => {
  const [isLoading, setIsLoading] = useState(false);

  const pendingPixelRef = useRef<Pixel | null>(null);
  const selectedColorRef = useRef(0);

  const { pixelDataRef } = useCanvasState();
  const { scheduleRedraw, rebuildImageData } = useCanvasRenderer({
    canvasRef,
    viewportRef,
    pendingPixelRef,
    selectedColorRef,
  });

  const fetchSnapshot = useCallback(
    async (timestamp: number) => {
      setIsLoading(true);
      try {
        const res = await apiFetch(
          `/api/canvas/snapshot/${new Date(timestamp).toISOString()}`,
          { signal: AbortSignal.timeout(10000) },
        );

        if (!res.ok) {
          toast.error('Failed to get canvas snapshot');
          return;
        }

        const buffer = await res.arrayBuffer();
        const data = new Uint8Array(buffer);
        pixelDataRef.current = data;
        rebuildImageData(data);
        scheduleRedraw();
      } catch {
        toast.error('Failed to get canvas snapshot');
      } finally {
        setIsLoading(false);
      }
    },
    [pixelDataRef, rebuildImageData, scheduleRedraw],
  );

  return { isLoading, fetchSnapshot, scheduleRedraw };
};
