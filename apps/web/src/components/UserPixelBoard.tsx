import { use } from 'react';
import { BasePixelBoard } from './BasePixelBoard';
import { usePixelBoard } from '@/hooks/usePixelBoard';

export const UserPixelBoard = ({
  canvasPromise,
}: {
  canvasPromise: Promise<Uint8Array>;
}) => {
  const initialData = use(canvasPromise);
  const base = usePixelBoard({ initialData });

  return <BasePixelBoard base={base} />;
};
