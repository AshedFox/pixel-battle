import { apiFetch } from '@/lib/api-client';
import { PixelInfoResponse } from '@repo/shared';
import { useState, useCallback, useTransition } from 'react';

export const usePixelInfo = () => {
  const [pixelInfo, setPixelInfo] = useState<PixelInfoResponse | null>(null);
  const [isPending, startTransition] = useTransition();

  const fetchPixelInfo = useCallback((x: number, y: number) => {
    startTransition(async () => {
      const res = await apiFetch(`/api/canvas/${x}/${y}`);
      const data = await res.json();
      setPixelInfo(data);
    });
  }, []);

  const clear = useCallback(() => setPixelInfo(null), []);

  return { pixelInfo, isPending, fetchPixelInfo, clear };
};
