import { apiFetch } from '@/lib/api-client';
import { CooldownResponse } from '@repo/shared/src/canvas/types';
import { useCallback, useEffect, useReducer, useState } from 'react';

export const useCooldown = () => {
  const [availableAt, setAvailableAt] = useState(0);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const fetchCooldown = useCallback(async () => {
    const res = await apiFetch('/api/canvas/cooldown');
    const { availableAt } = (await res.json()) as CooldownResponse;

    setAvailableAt(availableAt ? new Date(availableAt).getTime() : 0);
  }, []);

  useEffect(() => {
    fetchCooldown();
  }, [fetchCooldown]);

  useEffect(() => {
    if (availableAt === 0 || Date.now() >= availableAt) {
      return;
    }

    const interval = setInterval(() => {
      forceUpdate();
      if (Date.now() >= availableAt) {
        clearInterval(interval);
      }
    }, 200);
    return () => clearInterval(interval);
  }, [availableAt]);

  const startCooldown = useCallback(async () => {
    await fetchCooldown();
  }, [fetchCooldown]);

  const isOnCooldown = Date.now() < availableAt;
  const remainingMs = Math.max(0, availableAt - Date.now());

  return { isOnCooldown, remainingMs, startCooldown };
};
