import { useAuth } from '@/components/AuthProvider';
import { CooldownResponse } from '@repo/shared/src/canvas/types';
import { useCallback, useEffect, useReducer, useState } from 'react';

type Props = {
  apiUrl: string;
};

export const useCooldown = ({ apiUrl }: Props) => {
  const [availableAt, setAvailableAt] = useState(0);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);
  const { apiFetch } = useAuth();

  const fetchCooldown = useCallback(async () => {
    await apiFetch(apiUrl)
      .then<CooldownResponse>((res) => res.json())
      .then(({ availableAt }) => {
        setAvailableAt(availableAt ? new Date(availableAt).getTime() : 0);
      });
  }, [apiFetch, apiUrl]);

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
