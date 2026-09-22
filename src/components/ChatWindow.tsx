import { useEffect, useRef, useState, type FormEvent } from 'react';
import { formatTime } from '../lib/format';
import type { Chat, Message, MessageStatus } from '../types';
import { SendIcon, UserIcon } from './icons';

interface ChatWindowProps {
  chat: Chat | null;
  onSend: (text: string) => void;
  onBack: () => void;
}

export function ChatWindow({ chat, onSend, onBack }: ChatWindowProps) {
  const [draft, setDraft] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const count = chat?.messages.length ?? 0;
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count, chat?.id]);

  if (!chat) {
    return (
      <main className="chat-window">
        <div className="placeholder">
          Выберите чат слева — или создайте новый по телефону получателя.
        </div>
      </main>
    );
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft('');
  };

  return (
    <main className="chat-window">
      <header className="chat-header">
        <button className="back" onClick={onBack} aria-label="К списку чатов">←</button>
        <span className="avatar" aria-hidden="true"><UserIcon /></span>
        <div>
          <b>{chat.title}</b>
          <div className="phone">chatId: {chat.id}</div>
        </div>
      </header>

      <div className="messages" ref={scrollRef}>
        {chat.messages.length === 0 ? (
          <p className="messages-empty">
            Сообщений пока нет.<br />
            Напишите первое — оно уйдёт через GREEN-API SendMessage.
          </p>
        ) : (
          chat.messages.map((m) => <Bubble key={m.id} message={m} />)
        )}
      </div>

      <form className="composer" onSubmit={handleSubmit}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Сообщение"
          aria-label="Текст сообщения"
          autoComplete="off"
        />
        <button className="send-btn" type="submit" disabled={!draft.trim()} aria-label="Отправить">
          <SendIcon />
        </button>
      </form>
    </main>
  );
}

function Tick({ status }: { status: MessageStatus }) {
  switch (status) {
    case 'sending':
      return <span className="tick" title="Отправка">⏳</span>;
    case 'sent':
      return <span className="tick" title="Принято сервером GREEN-API">✓</span>;
    case 'delivered':
      return <span className="tick" title="Доставлено в MAX">✓✓</span>;
    case 'read':
      return <span className="tick read" title="Прочитано">✓✓</span>;
    case 'failed':
    case 'error':
      return <span className="tick error" title={status === 'failed' ? 'Не доставлено' : 'Сетевая ошибка'}>⚠</span>;
    default:
      return null;
  }
}

function Bubble({ message }: { message: Message }) {
  return (
    <div className={`bubble ${message.direction}`}>
      {message.text}
      {message.direction === 'outgoing' && <Tick status={message.status} />}
      <span className="time">{formatTime(message.timestamp)}</span>
    </div>
  );
}
