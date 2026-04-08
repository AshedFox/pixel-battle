import { useHeatmap } from '@/hooks/useHeatmap';
import { Viewport } from '@/hooks/useViewport';
import { PixelStream } from '@/lib/pixel-stream';
import {
  forwardRef,
  RefObject,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';

type Props = {
  containerRef: RefObject<HTMLDivElement | null>;
  viewportRef: RefObject<Viewport>;
  pixelStream: PixelStream;
  onEnabledChange?: (enabled: boolean) => void;
};

export type AdminHeatmapHandle = {
  redrawHeatmap: () => void;
  toggleHeatmap: () => void;
};

export const AdminHeatmap = forwardRef<AdminHeatmapHandle, Props>(
  ({ pixelStream, viewportRef, containerRef, onEnabledChange }, ref) => {
    const heatmapRef = useRef<HTMLCanvasElement>(null);
    const {
      addHeatPoint,
      redrawHeatmap,
      toggleHeatmap,
      isEnabled: heatmapEnabled,
    } = useHeatmap({
      heatmapRef,
      viewportRef,
    });

    useImperativeHandle(ref, () => ({ redrawHeatmap, toggleHeatmap }), [
      redrawHeatmap,
      toggleHeatmap,
    ]);

    useEffect(() => {
      onEnabledChange?.(heatmapEnabled);
    }, [heatmapEnabled, onEnabledChange]);

    useEffect(() => {
      const unsubscribe = pixelStream.subscribe((x, y) => addHeatPoint(x, y));

      return () => {
        unsubscribe();
      };
    }, [pixelStream, addHeatPoint]);

    useEffect(() => {
      const observer = new ResizeObserver(([entry]) => {
        if (!heatmapRef.current) {
          return;
        }

        const { width, height } = entry.contentRect;
        heatmapRef.current.width = Math.floor(width);
        heatmapRef.current.height = Math.floor(height);

        redrawHeatmap();
      });

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => observer.disconnect();
    }, [containerRef, redrawHeatmap]);

    return (
      <canvas
        ref={heatmapRef}
        onContextMenu={(e) => e.preventDefault()}
        className="block touch-none absolute pointer-events-none"
      />
    );
  },
);

AdminHeatmap.displayName = 'AdminHeatmap';
