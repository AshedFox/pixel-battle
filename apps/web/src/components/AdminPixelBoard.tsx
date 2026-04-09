import { useMemo, useRef, useState } from 'react';
import { AdminHeatmap, AdminHeatmapHandle } from './AdminHeatmap';
import { Button } from './ui/button';
import { PixelStream } from '@/lib/pixel-stream';
import { BasePixelBoard } from './BasePixelBoard';

export const AdminPixelBoard = ({
  canvasPromise,
}: {
  canvasPromise: Promise<Uint8Array>;
}) => {
  const adminHeatmapRef = useRef<AdminHeatmapHandle>(null);
  const pixelStream = useMemo(() => new PixelStream(), []);
  const [heatmapEnabled, setHeatmapEnabled] = useState(false);

  return (
    <BasePixelBoard
      canvasPromise={canvasPromise}
      onViewportChange={() => adminHeatmapRef.current?.redrawHeatmap()}
      onPixelUpdate={(x, y) => pixelStream.emit(x, y)}
      overlaysSlot={({ viewportRef, containerRef }) => (
        <AdminHeatmap
          ref={adminHeatmapRef}
          pixelStream={pixelStream}
          viewportRef={viewportRef}
          containerRef={containerRef}
          onEnabledChange={setHeatmapEnabled}
        />
      )}
      controlsSlot={() => (
        <Button
          variant="outline"
          onClick={() => adminHeatmapRef.current?.toggleHeatmap()}
        >
          {heatmapEnabled ? 'Hide Heatmap' : 'Show Heatmap'}
        </Button>
      )}
    />
  );
};
