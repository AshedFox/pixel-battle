import { apiFetch } from '@/lib/api-client';
import { CooldownResponse } from '@repo/shared/src/canvas/types';
import { useCallback, useEffect, useReducer, useState } from 'react';

export const useCooldown = () => {
  const [availableAt, setAvailableAt] = useState(0);
  const [cooldownMs, setCooldownMs] = useState(30000);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const fetchCooldown = useCallback(async () => {
    const res = await apiFetch('/api/canvas/cooldown');
    const { availableAt, cooldownMs } = (await res.json()) as CooldownResponse;

    setAvailableAt(availableAt ? new Date(availableAt).getTime() : 0);
    setCooldownMs(cooldownMs);
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

  const setCooldown = useCallback((timeAt: string | number | Date | null) => {
    setAvailableAt(timeAt ? new Date(timeAt).getTime() : 0);
  }, []);

  const startOptimisticCooldown = useCallback(() => {
    setAvailableAt(Date.now() + cooldownMs);
  }, [cooldownMs]);

  const isOnCooldown = Date.now() < availableAt;
  const remainingMs = Math.max(0, availableAt - Date.now());

  return {
    isOnCooldown,
    remainingMs,
    setCooldown,
    startOptimisticCooldown,
  };
};
