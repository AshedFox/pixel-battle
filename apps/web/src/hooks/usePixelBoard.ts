import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from 'react';
import { usePixelCanvas } from './usePixelCanvas';
import { useViewport } from './useViewport';
import { useCooldown } from './useCooldown';
import { createCoordsStore } from '@/lib/coords-store';
import { usePixelInfo } from './usePixelInfo';
import { useMediaQuery } from './useMediaQuery';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from '@repo/shared';
import { Pixel } from '@/types/pixel';

type Props = {
  initialData: Uint8Array;
  onPixelUpdate?: (x: number, y: number) => void;
  onViewportChange?: () => void;
};

export const usePixelBoard = ({
  initialData,
  onPixelUpdate,
  onViewportChange,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedColor, setSelectedColor] = useState(0);
  const [pendingPixel, setPendingPixel] = useState<Pixel | null>(null);
  const [popupPos, setPopupPos] = useState<Pixel | null>(null);
  const coordsStore = useMemo(() => createCoordsStore(), []);
  const [onlineCount, setOnlineCount] = useState(0);

  const {
    pixelInfo,
    isPending: isPixelInfoPending,
    fetchPixelInfo,
    clear,
  } = usePixelInfo();

  const {
    viewportRef,
    setOnViewportChange,
    toCanvasCoords,
    onWheel,
    onMouseDown: onViewportMouseDown,
    onMouseMove: onViewportMouseMove,
    onMouseUp,
    onTouchEnd,
    onTouchMove,
    onTouchStart,
  } = useViewport();

  const { isOnCooldown, remainingMs, setCooldown, startOptimisticCooldown } =
    useCooldown();

  const { placePixel, scheduleRedraw, getPixelColor } = usePixelCanvas({
    initialData,
    pendingPixel,
    canvasRef,
    selectedColorIndex: selectedColor,
    viewportRef,
    onOnlineChange: setOnlineCount,
    onCooldownUpdate: setCooldown,
    onPixelUpdate,
  });

  const [isPending, startTransition] = useTransition();

  const isSameColor =
    pendingPixel != null &&
    getPixelColor(pendingPixel.x, pendingPixel.y) === selectedColor;

  useEffect(() => {
    scheduleRedraw();
  }, [pendingPixel, selectedColor, scheduleRedraw]);

  useEffect(() => {
    setOnViewportChange(() => {
      scheduleRedraw();
      onViewportChange?.();
    });
  }, [setOnViewportChange, scheduleRedraw, onViewportChange]);

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
      startOptimisticCooldown();
      placePixel(pendingPixel.x, pendingPixel.y);
      setPendingPixel(null);
    });
  }, [
    pendingPixel,
    isOnCooldown,
    isSameColor,
    placePixel,
    startOptimisticCooldown,
  ]);

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

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button === 1 || e.button === 2) {
        onViewportMouseDown(e);
        return;
      }

      if (e.button === 0) {
        const { x, y } = toCanvasCoords(
          e.nativeEvent.offsetX,
          e.nativeEvent.offsetY,
        );

        if (pendingPixel && x === pendingPixel.x && y === pendingPixel.y) {
          return;
        }

        if (x >= 0 && x < CANVAS_WIDTH && y >= 0 && y < CANVAS_HEIGHT) {
          setPendingPixel({ x, y });
          fetchPixelInfo(x, y);
          const { offsetX, offsetY, scale } = viewportRef.current;
          setPopupPos({
            x: offsetX + x * scale + scale,
            y: offsetY + y * scale,
          });
        }
      }
    },
    [
      fetchPixelInfo,
      onViewportMouseDown,
      pendingPixel,
      toCanvasCoords,
      viewportRef,
    ],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      onViewportMouseMove(e);

      const { x, y } = toCanvasCoords(
        e.nativeEvent.offsetX,
        e.nativeEvent.offsetY,
      );

      if (x >= 0 && x < CANVAS_WIDTH && y >= 0 && y < CANVAS_HEIGHT) {
        coordsStore.emit({ x, y });
      } else {
        coordsStore.emit(null);
      }
    },
    [coordsStore, onViewportMouseMove, toCanvasCoords],
  );

  const handleMouseLeave = useCallback(() => {
    onMouseUp();
    coordsStore.emit(null);
  }, [coordsStore, onMouseUp]);

  const handlePixelPopoverClose = useCallback(() => {
    setPopupPos(null);
    clear();
  }, [clear]);

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

  return {
    containerRef,
    canvasRef,
    viewportRef,
    selectedColor,
    setSelectedColor,
    pendingPixel,
    setPendingPixel,
    popupPos,
    onlineCount,
    isOnCooldown,
    isPending,
    isSameColor,
    isDesktop,
    coordsStore,
    pixelInfo,
    isPixelInfoPending,
    setOnViewportChange,
    getPixelColor,
    scheduleRedraw,
    handleConfirm,
    handleMouseDown,
    handleMouseMove,
    handleMouseLeave,
    handlePixelPopoverClose,
    getPlaceText,
    onWheel,
    onMouseUp,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};
