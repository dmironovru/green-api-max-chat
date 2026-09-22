import { useState, type FormEvent } from 'react';
import type { Chat } from '../types';
import { LogoIcon, UserIcon } from './icons';

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  online: boolean;
  busy?: boolean;
  error?: string;
  onSelect: (chatId: string) => void;
  onCreate: (phone: string) => void;
  onLogout: () => void;
}

export function Sidebar({
  chats, activeChatId, online, busy, error, onSelect, onCreate, onLogout,
}: SidebarProps) {
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || busy) return;
    onCreate(phone);
    setPhone('');
  };

  return (
    <aside className="sidebar">
      <header className="sidebar-header">
        <div className="logo-sm" aria-hidden="true"><LogoIcon /></div>
        <div className="sidebar-title">
          <b>GREEN-API Chat</b>
          <span className="status">
            <i className={`dot${online ? ' online' : ''}`} />
            {online ? 'опрос очереди' : 'нет соединения с API'}
          </span>
        </div>
        <button className="logout" onClick={onLogout} title="Отключиться">Выйти</button>
      </header>

      <form className="new-chat" onSubmit={handleSubmit}>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Телефон получателя: +7 999 123-45-67"
          aria-label="Телефон получателя"
        />
        <button type="submit" disabled={!phone.trim() || busy}>{busy ? '…' : 'Чат'}</button>
      </form>
      {error && <p className="form-error" style={{ padding: '0 16px 8px', margin: 0 }}>{error}</p>}

      <div className="chat-list">
        {chats.length === 0 ? (
          <p className="chat-list-empty">
            Чатов пока нет.<br />Введите телефон выше, чтобы начать переписку.
          </p>
        ) : (
          chats.map((chat) => {
            const last = chat.messages[chat.messages.length - 1];
            return (
              <button
                key={chat.id}
                className={`chat-item${chat.id === activeChatId ? ' active' : ''}`}
                onClick={() => onSelect(chat.id)}
              >
                <span className="avatar" aria-hidden="true"><UserIcon /></span>
                <span className="meta">
                  <b>{chat.title}</b>
                  <span>{last ? last.text : 'Нет сообщений'}</span>
                </span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
