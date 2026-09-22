import type { RawNotification } from '../types';

export interface ParsedMessage {
  kind: 'message';
  id: string;
  chatId: string;
  text: string;
  timestamp: number;
  direction: 'incoming' | 'outgoing';
  senderName?: string;
  senderPhone?: string;
}

export interface ParsedStatus {
  kind: 'status';
  chatId: string;
  idMessage: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
}

export type ParsedNotification = ParsedMessage | ParsedStatus;

/**
 * Разбор уведомления GREEN-API v3.
 * Обрабатываем три типа:
 *   - incomingMessageReceived     → входящее сообщение
 *   - outgoingAPIMessageReceived  → эхо нашего сообщения (чтобы синхронизировать
 *                                   отправку с веба с самим MAX'ом на телефоне)
 *   - outgoingMessageStatus       → статус доставки: sent/delivered/read/failed
 */
export function parseNotification(n: RawNotification): ParsedNotification | null {
  const body = n?.body;
  if (!body) return null;

  const type = body.typeWebhook ?? body.typeMessage;

  // 1. Статусы доставки
  if (type === 'outgoingMessageStatus') {
    const chatId = body.chatId;
    const idMessage = body.idMessage;
    const statusRaw = body.status;
    if (!chatId || !idMessage || !statusRaw) return null;
    const statusMap: Record<string, ParsedStatus['status']> = {
      sent: 'sent',
      delivered: 'delivered',
      read: 'read',
      failed: 'failed',
    };
    const status = statusMap[statusRaw];
    if (!status) return null;
    return { kind: 'status', chatId, idMessage, status };
  }

  // 2. Сообщения
  if (type !== 'incomingMessageReceived' && type !== 'outgoingAPIMessageReceived') return null;

  const md = body.messageData;
  const text =
    md?.textMessageData?.textMessage ??
    md?.extendedTextMessageData?.text ??
    md?.text ??
    body.message;
  if (typeof text !== 'string' || text.trim() === '') return null;

  const chatId = body.chatId ?? body.senderData?.chatId ?? body.sender;
  if (!chatId) return null;

  const direction: 'incoming' | 'outgoing' =
    type === 'incomingMessageReceived' ? 'incoming' : 'outgoing';

  const senderPhone = body.senderData?.senderPhoneNumber;

  return {
    kind: 'message',
    id: body.idMessage ?? `${n.receiptId}`,
    chatId,
    text,
    timestamp: typeof body.timestamp === 'number' ? body.timestamp * 1000 : Date.now(),
    direction,
    senderName: body.senderData?.senderName,
    senderPhone: senderPhone !== undefined ? String(senderPhone) : undefined,
  };
}
