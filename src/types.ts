export interface Credentials {
  idInstance: string;
  apiTokenInstance: string;
  apiUrl: string;
}

export type MessageDirection = 'incoming' | 'outgoing';

/**
 * Статус доставки исходящего:
 *   sending   — в процессе отправки в GREEN-API (локально)
 *   sent      — принято сервером GREEN-API (очередь)
 *   delivered — доставлено в MAX собеседнику
 *   read      — прочитано
 *   failed    — ошибка доставки (например, квота, неактивен чат)
 *   error     — сетевая ошибка нашего клиента
 */
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed' | 'error';

export interface Message {
  id: string;
  text: string;
  timestamp: number;
  direction: MessageDirection;
  status: MessageStatus;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  lastActivity: number;
}

export type ChatMap = Record<string, Chat>;

export interface RawNotification {
  receiptId: number;
  body: {
    typeWebhook?: string;
    typeMessage?: string;
    timestamp?: number;
    idMessage?: string;
    chatId?: string;
    sender?: string;
    status?: string;
    instanceData?: { idInstance?: number; wid?: string; typeInstance?: string };
    senderData?: {
      chatId?: string;
      sender?: string;
      senderName?: string;
      senderContactName?: string;
      senderPhoneNumber?: number | string;
    };
    messageData?: {
      typeMessage?: string;
      textMessageData?: { textMessage?: string };
      extendedTextMessageData?: { text?: string };
      text?: string;
    };
    message?: string;
  };
}
