import { useEffect, useRef } from 'react';
import { deleteNotification, receiveNotification } from '../api/greenApi';
import { MAX_NOTIFICATIONS_PER_TICK, POLL_INTERVAL_MS } from '../config';
import type { Credentials, RawNotification } from '../types';

/**
 * Поллинг очереди уведомлений GREEN-API (HTTP API, требование №7).
 * Вебхуки не используем осознанно: им нужен бэкенд, а задание — про фронтенд.
 */
export function useIncoming(
  credentials: Credentials | null,
  onNotification: (n: RawNotification) => void,
  onStatus?: (ok: boolean) => void,
): void {
  const handlerRef = useRef(onNotification);
  handlerRef.current = onNotification;
  const statusRef = useRef(onStatus);
  statusRef.current = onStatus;

  useEffect(() => {
    if (!credentials) return;

    let stopped = false;
    let busy = false;

    const tick = async () => {
      if (busy) return;
      busy = true;
      const seen = new Set<number>();
      try {
        for (let i = 0; i < MAX_NOTIFICATIONS_PER_TICK; i += 1) {
          if (stopped) break;
          const notification = await receiveNotification(credentials);
          if (!notification || seen.has(notification.receiptId)) break;
          seen.add(notification.receiptId);
          handlerRef.current(notification);
          void deleteNotification(credentials, notification.receiptId);
        }
        statusRef.current?.(true);
      } catch (e) {
        console.error('[GREEN-API POLL ERROR]', e);
        statusRef.current?.(false);
      } finally {
        busy = false;
      }
    };

    void tick();
    const timer = setInterval(() => void tick(), POLL_INTERVAL_MS);
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [credentials]);
}
