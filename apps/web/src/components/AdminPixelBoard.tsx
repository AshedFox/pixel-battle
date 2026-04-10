import { use, useMemo, useRef, useState } from 'react';
import { AdminHeatmap, AdminHeatmapHandle } from './AdminHeatmap';
import { Button } from './ui/button';
import { PixelStream } from '@/lib/pixel-stream';
import { BasePixelBoard } from './BasePixelBoard';
import { usePixelBoard } from '@/hooks/usePixelBoard';

export const AdminPixelBoard = ({
  canvasPromise,
}: {
  canvasPromise: Promise<Uint8Array>;
}) => {
  const initialData = use(canvasPromise);
  const adminHeatmapRef = useRef<AdminHeatmapHandle>(null);
  const pixelStream = useMemo(() => new PixelStream(), []);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);
  const base = usePixelBoard({
    initialData,
    onViewportChange: () => adminHeatmapRef.current?.redrawHeatmap(),
    onPixelUpdate: (x, y) => pixelStream.emit(x, y),
  });
  const { viewportRef, containerRef } = base.refs;

  return (
    <BasePixelBoard
      base={base}
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
        <Button
          variant="outline"
          onClick={() => adminHeatmapRef.current?.toggleHeatmap()}
        >
          {heatmapEnabled ? 'Hide Heatmap' : 'Show Heatmap'}
        </Button>
      }
    />
  );
};
