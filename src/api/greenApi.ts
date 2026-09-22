import { INSTANCE_PREFIX, USE_VITE_PROXY } from '../config';
import type { Credentials, RawNotification } from '../types';

/**
 * Формирует URL запроса.
 * - В режиме прокси (dev Vite / prod Vercel): /api/proxy?path=waInstance{id}/{method}/{token}
 * - Без прокси (direct): apiUrl/waInstance{id}/{method}/{token}
 */
const instanceUrl = (c: Credentials) => {
  if (USE_VITE_PROXY) {
    return '/api/proxy';
  }
  return `${c.apiUrl}/${INSTANCE_PREFIX}${c.idInstance}`;
};

const buildPath = (c: Credentials, method: string, token: string) =>
  `${INSTANCE_PREFIX}${c.idInstance}/${method}/${token}`;

function headersWithProxy(c: Credentials, withJson = false): Record<string, string> {
  const h: Record<string, string> = {};
  if (withJson) h['Content-Type'] = 'application/json';
  if (USE_VITE_PROXY) h['x-api-url'] = c.apiUrl;
  return h;
}

export class GreenApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  if (!res.ok) {
    let detail = '';
    try {
      const data = (await res.json()) as { message?: string; error?: string };
      detail = data.message ?? data.error ?? '';
    } catch {
      /* тело не обязательно */
    }
    throw new GreenApiError(res.status, detail || `HTTP ${res.status}`);
  }
  return (await res.json()) as T;
}

/** Требование №6: отправка текстового сообщения (SendMessage). */
export function sendMessage(c: Credentials, chatId: string, message: string) {
  const url = USE_VITE_PROXY
    ? `${instanceUrl(c)}?path=${encodeURIComponent(buildPath(c, 'sendMessage', c.apiTokenInstance))}`
    : `${instanceUrl(c)}/sendMessage/${c.apiTokenInstance}`;

  return request<{ idMessage: string }>(url, {
    method: 'POST',
    headers: headersWithProxy(c, true),
    body: JSON.stringify({ chatId, message }),
  });
}

export interface CheckAccountResult {
  exist?: boolean;
  exists?: boolean;
  chatId?: string | number;
}

/**
 * MAX: chatId != номер телефона. Номер разрешаем в chatId методом CheckAccount.
 * Перебираем варианты тела запроса на случай расхождений версий API.
 */
export async function checkAccount(c: Credentials, phoneNumber: string): Promise<CheckAccountResult> {
  const url = USE_VITE_PROXY
    ? `${instanceUrl(c)}?path=${encodeURIComponent(buildPath(c, 'checkAccount', c.apiTokenInstance))}`
    : `${instanceUrl(c)}/checkAccount/${c.apiTokenInstance}`;

  const bodies: Record<string, unknown>[] = [
    { phoneNumber },
    { phoneNumber: Number(phoneNumber) },
    { chatId: `${phoneNumber}@c.us` },
  ];
  let lastError: Error | null = null;
  for (const body of bodies) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: headersWithProxy(c, true),
        body: JSON.stringify(body),
      });
      if (res.ok) return (await res.json()) as CheckAccountResult;
      lastError = new GreenApiError(res.status, `checkAccount: HTTP ${res.status}`);
    } catch (e) {
      lastError = e as Error;
    }
  }
  throw lastError ?? new Error('checkAccount: неизвестная ошибка');
}

/**
 * Требование №7: получение через HTTP API — поллинг очереди уведомлений.
 * Пустая очередь может вернуться пустым телом — нормализуем к null.
 */
export async function receiveNotification(c: Credentials): Promise<RawNotification | null> {
  const url = USE_VITE_PROXY
    ? `${instanceUrl(c)}?path=${encodeURIComponent(buildPath(c, 'receiveNotification', c.apiTokenInstance))}`
    : `${instanceUrl(c)}/receiveNotification/${c.apiTokenInstance}`;

  const res = await fetch(url, { headers: headersWithProxy(c) });
  if (!res.ok) throw new GreenApiError(res.status, `receiveNotification: HTTP ${res.status}`);
  const text = await res.text();
  if (!text || text.trim() === '') return null;
  try {
    const data = JSON.parse(text) as RawNotification | RawNotification[] | null;
    if (!data || Array.isArray(data)) return null;
    return data;
  } catch {
    console.warn('[GREEN-API] Не удалось распарсить ответ receiveNotification:', text);
    return null;
  }
}

/** Удаление уведомления из очереди. Ошибки не критичны. */
export async function deleteNotification(c: Credentials, receiptId: number): Promise<void> {
  const path = `${INSTANCE_PREFIX}${c.idInstance}/deleteNotification/${c.apiTokenInstance}/${receiptId}`;
  const url = USE_VITE_PROXY
    ? `${instanceUrl(c)}?path=${encodeURIComponent(path)}`
    : `${c.apiUrl}/${path}`;

  try {
    await fetch(url, { method: 'DELETE', headers: headersWithProxy(c) });
  } catch {
    /* дубликаты отфильтрует дедупликация по idMessage */
  }
}
