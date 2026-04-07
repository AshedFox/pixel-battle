import { Pixel } from '@/types/pixel';

export const createCoordsStore = () => {
  let currentCoords: Pixel | null = null;
  const listeners = new Set<(c: Pixel | null) => void>();

  return {
    emit: (coords: Pixel | null) => {
      const isSame =
        (coords === null && currentCoords === null) ||
        (coords !== null &&
          currentCoords !== null &&
          coords.x === currentCoords.x &&
          coords.y === currentCoords.y);

      if (isSame) {
        return;
      }

      currentCoords = coords;
      listeners.forEach((l) => l(coords));
    },
    subscribe: (listener: (c: Pixel | null) => void) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getSnapshot: () => currentCoords,
  };
};
