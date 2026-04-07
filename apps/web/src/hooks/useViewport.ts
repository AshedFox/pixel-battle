import { Touch, useCallback, useRef } from 'react';

export type Viewport = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

const MIN_SCALE = 0.1;
const MAX_SCALE = 40;

export const useViewport = () => {
  const viewportRef = useRef<Viewport>({
    offsetX: 0,
    offsetY: 0,
    scale: 0.9,
  });
  const onChangeRef = useRef<() => void>(() => {});
  const dragStart = useRef<{
    mouseX: number;
    mouseY: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const setOnViewportChange = useCallback((fn: () => void) => {
    onChangeRef.current = fn;
  }, []);

  const toCanvasCoords = useCallback((localX: number, localY: number) => {
    const { offsetX, offsetY, scale } = viewportRef.current;
    return {
      x: Math.floor((localX - offsetX) / scale),
      y: Math.floor((localY - offsetY) / scale),
    };
  }, []);

  const onWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const vp = viewportRef.current;
    const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
    const newScale = Math.min(
      MAX_SCALE,
      Math.max(MIN_SCALE, vp.scale * zoomFactor),
    );
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    viewportRef.current = {
      scale: newScale,
      offsetX: mouseX - (mouseX - vp.offsetX) * (newScale / vp.scale),
      offsetY: mouseY - (mouseY - vp.offsetY) * (newScale / vp.scale),
    };

    onChangeRef.current();
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || e.button === 2) {
      const vp = viewportRef.current;
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        offsetX: vp.offsetX,
        offsetY: vp.offsetY,
      };
    }
  }, []);

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragStart.current) {
      return;
    }

    const dx = e.clientX - dragStart.current.mouseX;
    const dy = e.clientY - dragStart.current.mouseY;

    viewportRef.current = {
      ...viewportRef.current,
      offsetX: dragStart.current.offsetX + dx,
      offsetY: dragStart.current.offsetY + dy,
    };
    onChangeRef.current();
  }, []);

  const onMouseUp = useCallback(() => {
    dragStart.current = null;
  }, []);

  const touchStart = useRef<{
    touches: { x: number; y: number }[];
    offsetX: number;
    offsetY: number;
    scale: number;
    dist: number;
  } | null>(null);

  const getTouchDist = (a: Touch, b: Touch) =>
    Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);

  const getTouchMidpoint = (a: Touch, b: Touch) => ({
    x: (a.clientX + b.clientX) / 2,
    y: (a.clientY + b.clientY) / 2,
  });

  const onTouchStart = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    const vp = viewportRef.current;

    if (e.touches.length === 1) {
      touchStart.current = {
        touches: [{ x: e.touches[0].clientX, y: e.touches[0].clientY }],
        offsetX: vp.offsetX,
        offsetY: vp.offsetY,
        scale: vp.scale,
        dist: 0,
      };
    } else if (e.touches.length === 2) {
      touchStart.current = {
        touches: [],
        offsetX: vp.offsetX,
        offsetY: vp.offsetY,
        scale: vp.scale,
        dist: getTouchDist(e.touches[0], e.touches[1]),
      };
    }
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!touchStart.current) {
      return;
    }
    const vp = viewportRef.current;

    if (e.touches.length === 1 && touchStart.current.touches.length === 1) {
      const dx = e.touches[0].clientX - touchStart.current.touches[0].x;
      const dy = e.touches[0].clientY - touchStart.current.touches[0].y;
      viewportRef.current = {
        ...vp,
        offsetX: touchStart.current.offsetX + dx,
        offsetY: touchStart.current.offsetY + dy,
      };
      onChangeRef.current();
    } else if (e.touches.length === 2 && touchStart.current.dist > 0) {
      const newDist = getTouchDist(e.touches[0], e.touches[1]);
      const zoomFactor = newDist / touchStart.current.dist;
      const newScale = Math.min(
        MAX_SCALE,
        Math.max(MIN_SCALE, touchStart.current.scale * zoomFactor),
      );

      const mid = getTouchMidpoint(e.touches[0], e.touches[1]);
      const rect = (
        e.currentTarget as HTMLCanvasElement
      ).getBoundingClientRect();
      const mouseX = mid.x - rect.left;
      const mouseY = mid.y - rect.top;

      viewportRef.current = {
        scale: newScale,
        offsetX:
          mouseX -
          (mouseX - touchStart.current.offsetX) *
            (newScale / touchStart.current.scale),
        offsetY:
          mouseY -
          (mouseY - touchStart.current.offsetY) *
            (newScale / touchStart.current.scale),
      };
      onChangeRef.current();
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    touchStart.current = null;
  }, []);

  return {
    viewportRef,
    setOnViewportChange,
    toCanvasCoords,
    onWheel,
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};
