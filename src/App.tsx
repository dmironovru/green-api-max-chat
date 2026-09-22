import { useCallback, useEffect, useMemo, useState } from 'react';
import { checkAccount, sendMessage } from './api/greenApi';
import { ChatWindow } from './components/ChatWindow';
import { LoginForm } from './components/LoginForm';
import { Sidebar } from './components/Sidebar';
import { useIncoming } from './hooks/useIncoming';
import { formatPhone, normalizePhone } from './lib/format';
import { parseNotification } from './lib/parse';
import {
  clearCredentials, loadChats, loadCredentials, saveChats, saveCredentials,
} from './lib/storage';
import type { ChatMap, Credentials, Message, RawNotification } from './types';

export default function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(() => loadCredentials());
  const [chats, setChats] = useState<ChatMap>({});
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [online, setOnline] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => {
    setChats(credentials ? loadChats(credentials.idInstance) : {});
    setActiveChatId(null);
  }, [credentials]);

  useEffect(() => {
    if (credentials) saveChats(credentials.idInstance, chats);
  }, [chats, credentials]);

  const upsertMessage = useCallback(
    (chatId: string, message: Message, preferredTitle?: string) => {
      setChats((prev) => {
        const chat = prev[chatId];
        const existsMsg = chat?.messages.some((m) => m.id === message.id) ?? false;
        const messages = existsMsg
          ? chat.messages.map((m) => (m.id === message.id ? { ...m, ...message } : m))
          : [...(chat?.messages ?? []), message];
        return {
          ...prev,
          [chatId]: {
            id: chatId,
            title: chat?.title ?? preferredTitle ?? `Чат ${chatId}`,
            messages,
            lastActivity: Math.max(chat?.lastActivity ?? 0, message.timestamp),
          },
        };
      });
    },
    [],
  );

  const updateMessage = useCallback(
    (chatId: string, messageId: string, patch: Partial<Message>) => {
      setChats((prev) => {
        const chat = prev[chatId];
        if (!chat) return prev;
        return {
          ...prev,
          [chatId]: {
            ...chat,
            messages: chat.messages.map((m) => (m.id === messageId ? { ...m, ...patch } : m)),
          },
        };
      });
    },
    [],
  );

  const handleNotification = useCallback(
    (notification: RawNotification) => {
      const parsed = parseNotification(notification);
      if (!parsed) return;

      if (parsed.kind === 'status') {
        // Обновляем статус существующего исходящего сообщения.
        // Для эхо-сообщений (outgoingAPIMessageReceived), которые уже сохранены,
        // это тоже поднимет их до delivered/read.
        updateMessage(parsed.chatId, parsed.idMessage, { status: parsed.status });
        return;
      }

      // Сообщение
      const title =
        parsed.senderName ||
        (parsed.senderPhone ? formatPhone(parsed.senderPhone) : undefined);
      upsertMessage(parsed.chatId, {
        id: parsed.id,
        text: parsed.text,
        timestamp: parsed.timestamp,
        direction: parsed.direction,
        status: 'sent',
      }, title);
    },
    [upsertMessage, updateMessage],
  );

  useIncoming(credentials, handleNotification, setOnline);

  const createChat = useCallback(
    async (rawPhone: string) => {
      if (!credentials) return;
      const phone = normalizePhone(rawPhone);
      if (!phone) return;
      setCreateError('');
      setCreating(true);
      try {
        const account = await checkAccount(credentials, phone);
        const chatId = account.chatId !== undefined ? String(account.chatId) : '';
        const exists = account.exist ?? account.exists ?? false;
        if (!exists || !chatId) {
          setCreateError(`Номер ${formatPhone(phone)} не найден в MAX.`);
          return;
        }
        setChats((prev) =>
          prev[chatId]
            ? prev
            : {
                ...prev,
                [chatId]: {
                  id: chatId,
                  title: formatPhone(phone),
                  messages: [],
                  lastActivity: Date.now(),
                },
              },
        );
        setActiveChatId(chatId);
      } catch (e) {
        setCreateError(`Не удалось проверить номер: ${(e as Error).message}`);
      } finally {
        setCreating(false);
      }
    },
    [credentials],
  );

  const handleSend = useCallback(
    async (text: string) => {
      if (!credentials || !activeChatId) return;
      const chatId = activeChatId;
      const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      upsertMessage(chatId, {
        id: localId, text, timestamp: Date.now(), direction: 'outgoing', status: 'sending',
      });
      try {
        const { idMessage } = await sendMessage(credentials, chatId, text);
        // После отправки GREEN-API пришлёт outgoingAPIMessageReceived с idMessage —
        // по нему придут статусы delivered/read. Сохраним id сразу, чтобы связать.
        updateMessage(chatId, localId, { id: idMessage || localId, status: 'sent' });
      } catch (e) {
        updateMessage(chatId, localId, { status: 'error' });
        console.error('[GREEN-API] sendMessage error:', e);
      }
    },
    [credentials, activeChatId, upsertMessage, updateMessage],
  );

  const handleLogout = useCallback(() => {
    clearCredentials();
    setCredentials(null);
    setOnline(false);
  }, []);

  const chatList = useMemo(
    () => Object.values(chats).sort((a, b) => b.lastActivity - a.lastActivity),
    [chats],
  );

  if (!credentials) {
    return (
      <LoginForm
        onSubmit={(next) => {
          saveCredentials(next);
          setCredentials(next);
        }}
      />
    );
  }

  const activeChat = activeChatId ? (chats[activeChatId] ?? null) : null;

  return (
    <div className={`app${activeChat ? ' app--chat' : ''}`}>
      <Sidebar
        chats={chatList}
        activeChatId={activeChatId}
        online={online}
        busy={creating}
        error={createError}
        onSelect={setActiveChatId}
        onCreate={createChat}
        onLogout={handleLogout}
      />
      <ChatWindow chat={activeChat} onSend={handleSend} onBack={() => setActiveChatId(null)} />
    </div>
  );
}
