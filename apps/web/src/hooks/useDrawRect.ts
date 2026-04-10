import { useCallback, useRef, useState } from 'react';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@repo/shared';
import { Viewport } from './useViewport';
import { Pixel } from '@/types/pixel';

export type Selection = { x1: number; y1: number; x2: number; y2: number };

type Props = {
  viewportRef: React.RefObject<Viewport>;
  selectionRef: React.RefObject<Selection | null>;
  scheduleRedraw: () => void;
  onFill: (x: number, y: number, width: number, height: number) => void;
};

export const useDrawRect = ({
  viewportRef,
  selectionRef,
  scheduleRedraw,
  onFill,
}: Props) => {
  const [active, setActive] = useState(false);
  const isDragging = useRef(false);

  const [selection, setSelection] = useState<Selection | null>(null);

  const toCanvasCoords = useCallback(
    (offsetX: number, offsetY: number): Pixel => {
      const { offsetX: vpX, offsetY: vpY, scale } = viewportRef.current;

      return {
        x: Math.floor((offsetX - vpX) / scale),
        y: Math.floor((offsetY - vpY) / scale),
      };
    },
    [viewportRef],
  );

  const clamp = (v: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, v));
  };

  const activate = useCallback(() => {
    setActive(true);
    selectionRef.current = null;
    setSelection(selectionRef.current);
  }, [selectionRef]);

  const deactivate = useCallback(() => {
    setActive(false);
    isDragging.current = false;
    selectionRef.current = null;
    setSelection(selectionRef.current);
    scheduleRedraw();
  }, [selectionRef, scheduleRedraw]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (e.button !== 0) {
        return;
      }

      const { x, y } = toCanvasCoords(
        e.nativeEvent.offsetX,
        e.nativeEvent.offsetY,
      );
      const cx = clamp(x, 0, CANVAS_WIDTH - 1);
      const cy = clamp(y, 0, CANVAS_HEIGHT - 1);

      isDragging.current = true;
      selectionRef.current = { x1: cx, y1: cy, x2: cx, y2: cy };
      setSelection(selectionRef.current);
      scheduleRedraw();
    },
    [toCanvasCoords, selectionRef, scheduleRedraw],
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isDragging.current || !selectionRef.current) {
        return;
      }

      const { x, y } = toCanvasCoords(
        e.nativeEvent.offsetX,
        e.nativeEvent.offsetY,
      );

      selectionRef.current = {
        ...selectionRef.current,
        x2: clamp(x, 0, CANVAS_WIDTH - 1),
        y2: clamp(y, 0, CANVAS_HEIGHT - 1),
      };
      setSelection(selectionRef.current);
      scheduleRedraw();
    },
    [toCanvasCoords, selectionRef, scheduleRedraw],
  );

  const onMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const confirm = useCallback(() => {
    const sel = selectionRef.current;

    if (!sel) {
      return;
    }

    const x = Math.min(sel.x1, sel.x2);
    const y = Math.min(sel.y1, sel.y2);
    const width = Math.abs(sel.x2 - sel.x1) + 1;
    const height = Math.abs(sel.y2 - sel.y1) + 1;

    onFill(x, y, width, height);

    isDragging.current = false;
    selectionRef.current = null;
    setSelection(selectionRef.current);
    scheduleRedraw();
  }, [selectionRef, onFill, scheduleRedraw]);

  return {
    active,
    activate,
    deactivate,
    confirm,
    selectionSize: selection
      ? {
          w: Math.abs(selection.x2 - selection.x1) + 1,
          h: Math.abs(selection.y2 - selection.y1) + 1,
        }
      : null,
    handlers: {
      onMouseDown,
      onMouseMove,
      onMouseUp,
    },
  };
};
