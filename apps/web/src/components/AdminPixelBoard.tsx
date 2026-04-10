import { use, useCallback, useMemo, useRef, useState } from 'react';
import { AdminHeatmap, AdminHeatmapHandle } from './AdminHeatmap';
import { Button } from './ui/button';
import { PixelStream } from '@/lib/pixel-stream';
import { BasePixelBoard } from './BasePixelBoard';
import { usePixelBoard } from '@/hooks/usePixelBoard';
import { Selection, useDrawRect } from '@/hooks/useDrawRect';
import { Field } from './ui/field';
import { MAX_FILL_AREA } from '@repo/shared';

export const AdminPixelBoard = ({
  canvasPromise,
}: {
  canvasPromise: Promise<Uint8Array>;
}) => {
  const initialData = use(canvasPromise);
  const adminHeatmapRef = useRef<AdminHeatmapHandle>(null);
  const pixelStream = useMemo(() => new PixelStream(), []);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const selectionRef = useRef<Selection>(null);
  const base = usePixelBoard({
    initialData,
    onViewportChange: () => adminHeatmapRef.current?.redrawHeatmap(),
    onPixelUpdate: (x, y) => pixelStream.emit(x, y),
    selectionRef,
  });
  const { viewportRef, containerRef } = base.refs;
  const { scheduleRedraw } = base;

  const drawRect = useDrawRect({
    viewportRef,
    scheduleRedraw,
    selectionRef,
    onFill: base.drawRect,
  });

  const handleMouseUp = useCallback(() => {
    drawRect.handlers.onMouseUp();

    base.canvasHandlers.onMouseUp();
  }, [base.canvasHandlers, drawRect]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (drawRect.active) {
        drawRect.handlers.onMouseMove(e);
      }

      base.canvasHandlers.onMouseMove(e);
    },
    [base.canvasHandlers, drawRect],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (drawRect.active && e.button === 0) {
        drawRect.handlers.onMouseDown(e);
        return;
      }

      base.canvasHandlers.onMouseDown(e);
    },
    [base.canvasHandlers, drawRect],
  );

  return (
    <BasePixelBoard
      base={base}
      canvasHandlers={{
        onMouseUp: handleMouseUp,
        onMouseMove: handleMouseMove,
        onMouseDown: handleMouseDown,
      }}
      overlaysSlot={
        <AdminHeatmap
          ref={adminHeatmapRef}
          pixelStream={pixelStream}
          viewportRef={viewportRef}
          containerRef={containerRef}
          onEnabledChange={setHeatmapEnabled}
        />
      }
      controlsSlot={
        <Field>
          <Button
            variant="outline"
            onClick={() => adminHeatmapRef.current?.toggleHeatmap()}
          >
            {heatmapEnabled ? 'Hide Heatmap' : 'Show Heatmap'}
          </Button>
          {drawRect.active ? (
            <Field className="flex-1" orientation="horizontal">
              <Button
                className="grow"
                onClick={drawRect.confirm}
                disabled={
                  !drawRect.selectionSize ||
                  drawRect.selectionSize.w * drawRect.selectionSize.h >
                    MAX_FILL_AREA
                }
              >
                {!drawRect.selectionSize
                  ? 'Select area...'
                  : drawRect.selectionSize.w * drawRect.selectionSize.h >
                      MAX_FILL_AREA
                    ? 'Area too big'
                    : `Fill ${drawRect.selectionSize.w}x${drawRect.selectionSize.h}`}
              </Button>
              <Button
                className="grow"
                variant="outline"
                onClick={drawRect.deactivate}
              >
                Cancel
              </Button>
            </Field>
          ) : (
            <Button
              variant="outline"
              onClick={() => {
                base.handlePixelPopoverClose();
                base.setPendingPixel(null);
                drawRect.activate();
              }}
            >
              Fill Area
            </Button>
          )}
        </Field>
      }
    />
  );
};
