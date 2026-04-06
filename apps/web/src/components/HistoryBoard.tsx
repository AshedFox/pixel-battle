import { useHistoryCanvas } from '@/hooks/useHistoryCanvas';
import { useViewport } from '@/hooks/useViewport';
import { useRef, useEffect, useCallback, useState } from 'react';
import { TimeControls } from './TimeControls';
import { Spinner } from './ui/spinner';

export const HistoryBoard = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [now, setNow] = useState(Date.now());

  const {
    viewportRef,
    setOnViewportChange,
    onWheel,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onTouchEnd,
    onTouchMove,
    onTouchStart,
  } = useViewport();

  const { isLoading, fetchSnapshot, scheduleRedraw } = useHistoryCanvas({
    canvasRef,
    viewportRef,
  });

  const handleTimestampChange = useCallback(
    async (ts: number) => {
      await fetchSnapshot(ts);
    },
    [fetchSnapshot],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setOnViewportChange(scheduleRedraw);
  }, [setOnViewportChange, scheduleRedraw]);

  useEffect(() => {
    handleTimestampChange(Date.now());
  }, [handleTimestampChange]);

  useEffect(() => {
    const observer = new ResizeObserver(([entry]) => {
      if (!canvasRef.current) {
        return;
      }

      const { width, height } = entry.contentRect;
      canvasRef.current.width = Math.floor(width);
      canvasRef.current.height = Math.floor(height);

      scheduleRedraw();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [scheduleRedraw]);

  return (
    <div className="relative overflow-hidden flex-1 bg-gray-100">
      {isLoading && (
        <div className="absolute inset-0 bg-background/40 backdrop-blur-xs z-10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Spinner className="size-10 text-muted-foreground" />
            <span className="text-sm text-muted-foreground font-medium">
              Loading canvas…
            </span>
          </div>
        </div>
      )}
      <div ref={containerRef} className="absolute inset-0 @container">
        <canvas
          ref={canvasRef}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchEnd={onTouchEnd}
          onTouchMove={onTouchMove}
          onTouchStart={onTouchStart}
          onContextMenu={(e) => e.preventDefault()}
          className="block touch-none"
          style={{ imageRendering: 'pixelated' }}
        />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-background/90 backdrop-blur-md border rounded-xl shadow-lg px-4 py-3 max-w-xl w-full">
          <TimeControls
            now={now}
            isLoading={isLoading}
            onTimestampChange={handleTimestampChange}
          />
        </div>
      </div>
    </div>
  );
};
