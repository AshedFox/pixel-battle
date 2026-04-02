import { useAuth } from '@/components/AuthProvider';
import { PixelInfoResponse } from '@repo/shared';
import { useState, useCallback, useTransition } from 'react';

export const usePixelInfo = ({ apiUrl }: { apiUrl: string }) => {
  const [pixelInfo, setPixelInfo] = useState<PixelInfoResponse | null>(null);
  const { apiFetch } = useAuth();
  const [isPending, startTransition] = useTransition();

  const fetchPixelInfo = useCallback(
    (x: number, y: number) => {
      startTransition(async () => {
        const res = await apiFetch(`${apiUrl}/${x}/${y}`);
        const data = await res.json();
        setPixelInfo(data);
      });
    },
    [apiFetch, apiUrl],
  );

  const clear = useCallback(() => setPixelInfo(null), []);

  return { pixelInfo, isPending, fetchPixelInfo, clear };
};
