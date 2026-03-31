import { useEffect, useRef, useCallback } from 'react';

type Props = {
  url: string;
  token: string | null;
  onMessage: (data: unknown) => void;
};

export const useWebSocket = ({ url, onMessage, token }: Props) => {
  const wsRef = useRef<WebSocket | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const send = useCallback((payload: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(payload));
    }
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    let reconnectCount = 0;
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    function connect() {
      if (cancelled) {
        return;
      }

      const ws = new WebSocket(`${url}?token=${token}`);
      wsRef.current = ws;

      ws.onmessage = (event) => {
        try {
          onMessageRef.current(JSON.parse(event.data));
        } catch {
          /* empty */
        }
      };

      ws.onclose = (event) => {
        if (event.code === 4001 || cancelled) {
          return;
        }
        timeoutId = setTimeout(
          connect,
          Math.min(16000, 1000 * 2 ** reconnectCount++),
        );
      };

      ws.onerror = () => ws.close();
    }

    connect();

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      wsRef.current?.close();
    };
  }, [token, url]);

  return { send };
};
