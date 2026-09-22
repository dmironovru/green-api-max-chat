/** Префикс контекста инстанса: единый для всех мессенджеров (MAX, WhatsApp, Telegram). */
export const INSTANCE_PREFIX = 'waInstance';

/** Интервал поллинга входящих уведомлений, мс. */
export const POLL_INTERVAL_MS = 5000;

/** Защита от бесконечного draining очереди за один тик. */
export const MAX_NOTIFICATIONS_PER_TICK = 25;

/**
 * true  — запросы ходят через dev-прокси Vite на /api (обход CORS).
 * false — напрямую на apiUrl (если GREEN-API отдаёт CORS-заголовки).
 */
export const USE_VITE_PROXY = true;

/** Хост по idInstance: первые 4 цифры — номер кластера (сверь с apiUrl в кабинете). */
export function deriveApiUrl(idInstance: string): string {
  return `https://${idInstance.slice(0, 4)}.api.green-api.com`;
}
