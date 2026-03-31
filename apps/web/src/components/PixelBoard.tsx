import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { usePixelCanvas } from '@/hooks/usePixelCanvas';
import { useViewport } from '@/hooks/useViewport';
import { ColorPicker } from './ColorPicker';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@repo/shared';
import { useCooldown } from '@/hooks/useCooldown';
import { cn } from '@/lib/utils';
import { Pixel } from '@/types/pixel';
import { Button } from './ui/button';
import { Field } from './ui/field';
import { createCoordsStore } from '@/lib/coords-store';
import { CoordsBadge } from './CoordsBadge';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Drawer, DrawerContent, DrawerTrigger } from './ui/drawer';
import { MoreVerticalIcon } from 'lucide-react';
import { ButtonGroup } from './ui/button-group';

const WS_API_URL = import.meta.env.VITE_API_WS_URL;

export const PixelBoard = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedColor, setSelectedColor] = useState(0);
  const [pendingPixel, setPendingPixel] = useState<Pixel | null>(null);
  const coordsStore = useMemo(() => createCoordsStore(), []);

  const {
    viewportRef,
    setOnViewportChange,
    toCanvasCoords,
    onWheel,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onTouchEnd,
    onTouchMove,
    onTouchStart,
  } = useViewport();

  const { placePixel, scheduleRedraw, getPixelColor } = usePixelCanvas({
    wsUrl: `${WS_API_URL}/api/canvas/ws`,
    apiUrl: '/api/canvas',
    pendingPixel,
    canvasRef,
    selectedColorIndex: selectedColor,
    viewportRef: viewportRef,
  });
  const { isOnCooldown, remainingMs, startCooldown } = useCooldown({
    apiUrl: '/api/canvas/cooldown',
  });
  const [isPending, startTransition] = useTransition();

  const isSameColor =
    pendingPixel != null &&
    getPixelColor(pendingPixel.x, pendingPixel.y) === selectedColor;

  useEffect(() => {
    setOnViewportChange(scheduleRedraw);
  }, [setOnViewportChange, scheduleRedraw]);

  useEffect(() => {
    scheduleRedraw();
  }, [pendingPixel, selectedColor, scheduleRedraw]);

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

  const handleConfirm = useCallback(async () => {
    if (!pendingPixel || isOnCooldown || isSameColor) {
      return;
    }
    startTransition(async () => {
      placePixel(pendingPixel.x, pendingPixel.y);
      await startCooldown();
      setPendingPixel(null);
    });
  }, [pendingPixel, isOnCooldown, isSameColor, placePixel, startCooldown]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button === 1 || e.button === 2) {
        onMouseDown(e);
        return;
      }

      if (e.button === 0) {
        const rect = e.currentTarget.getBoundingClientRect();
        const { x, y } = toCanvasCoords(e.clientX, e.clientY, rect);

        if (x >= 0 && x < CANVAS_WIDTH && y >= 0 && y < CANVAS_HEIGHT) {
          setPendingPixel({ x, y });
        }
      }
    },
    [onMouseDown, toCanvasCoords],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      onMouseMove(e);

      const rect = e.currentTarget.getBoundingClientRect();
      const { x, y } = toCanvasCoords(e.clientX, e.clientY, rect);

      if (x >= 0 && x < CANVAS_WIDTH && y >= 0 && y < CANVAS_HEIGHT) {
        coordsStore.emit({ x, y });
      } else {
        coordsStore.emit(null);
      }
    },
    [coordsStore, onMouseMove, toCanvasCoords],
  );

  const handleMouseLeave = useCallback(() => {
    onMouseUp();
    coordsStore.emit(null);
  }, [coordsStore, onMouseUp]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleConfirm]);

  const getPlaceText = useCallback(() => {
    if (isPending) {
      return 'Placing pixel...';
    }

    if (isOnCooldown) {
      return `Cooldown: ${Math.ceil(remainingMs / 1000)}s`;
    }

    if (!pendingPixel) {
      return 'Select pixel...';
    }

    if (isSameColor) {
      return 'Already this color';
    }

    return `Place (${pendingPixel.x}, ${pendingPixel.y})`;
  }, [isOnCooldown, isPending, isSameColor, pendingPixel, remainingMs]);

  const isDesktop = useMediaQuery('(min-width: 768px)', { defaultValue: true });

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden flex-1 bg-gray-100 @container flex flex-col"
    >
      <canvas
        ref={canvasRef}
        onWheel={onWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchEnd={onTouchEnd}
        onTouchMove={onTouchMove}
        onTouchStart={onTouchStart}
        onContextMenu={(e) => e.preventDefault()}
        className={cn(
          'block touch-none',
          isOnCooldown ? 'cursor-not-allowed' : 'cursor-crosshair',
        )}
        style={{ imageRendering: 'pixelated' }}
      />
      {isDesktop ? (
        <div className="absolute bottom-8 left-8 flex flex-col gap-2 items-center">
          <ColorPicker selected={selectedColor} onChange={setSelectedColor} />
          <Field>
            <Button
              disabled={
                isOnCooldown || !pendingPixel || isSameColor || isPending
              }
              size="lg"
              onClick={handleConfirm}
            >
              {getPlaceText()}
            </Button>
          </Field>
        </div>
      ) : (
        <div className="absolute bottom-0 w-full">
          <ButtonGroup className="w-full">
            <Button
              className="flex-1"
              disabled={
                isOnCooldown || !pendingPixel || isSameColor || isPending
              }
              size="lg"
              onClick={handleConfirm}
            >
              {getPlaceText()}
            </Button>
            <Drawer>
              <DrawerTrigger asChild>
                <Button size="icon-lg" variant="outline">
                  <MoreVerticalIcon />
                </Button>
              </DrawerTrigger>
              <DrawerContent className="gap-6">
                <ColorPicker
                  selected={selectedColor}
                  onChange={setSelectedColor}
                />
              </DrawerContent>
            </Drawer>
          </ButtonGroup>
        </div>
      )}

      <div className="absolute top-8 left-[50%] -translate-[50%]">
        <CoordsBadge coordsStore={coordsStore} />
      </div>
    </div>
  );
};
