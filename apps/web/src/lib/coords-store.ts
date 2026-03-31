import { Pixel } from '@/types/pixel';

export const createCoordsStore = () => {
  let currentCoords: Pixel | null = null;
  const listeners = new Set<(c: Pixel | null) => void>();

  return {
    emit: (coords: Pixel | null) => {
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
