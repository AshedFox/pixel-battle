import { Suspense, useMemo } from 'react';
import { Spinner } from './ui/spinner';
import { apiFetch } from '@/lib/api-client';
import { useAuth } from './AuthProvider';
import { AdminPixelBoard } from './AdminPixelBoard';
import { UserPixelBoard } from './UserPixelBoard';

const CanvasLoadingFallback = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
    <div className="flex flex-col items-center gap-3">
      <Spinner className="size-10 text-gray-400" />
      <span className="text-sm text-gray-500 font-medium">Loading canvas…</span>
    </div>
  </div>
);

export const PixelBoard = () => {
  const canvasPromise = useMemo(async () => {
    const res = await apiFetch('/api/canvas');
    const buffer = await res.arrayBuffer();
    return new Uint8Array(buffer);
  }, []);

  const { role } = useAuth();

  return (
    <div className="relative overflow-hidden flex-1 bg-gray-100">
      <Suspense fallback={<CanvasLoadingFallback />}>
        {role === 'ADMIN' ? (
          <AdminPixelBoard canvasPromise={canvasPromise} />
        ) : (
          <UserPixelBoard canvasPromise={canvasPromise} />
        )}
      </Suspense>
    </div>
  );
};
