import type { ChatMap, Credentials } from '../types';

const CRED_KEY = 'green-api-chat:credentials';
const chatsKey = (idInstance: string) => `green-api-chat:chats:${idInstance}`;

export function loadCredentials(): Credentials | null {
  try {
    const raw = localStorage.getItem(CRED_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Credentials;
    return c && c.idInstance && c.apiTokenInstance && c.apiUrl ? c : null;
  } catch {
    return null;
  }
}

export function saveCredentials(c: Credentials): void {
  localStorage.setItem(CRED_KEY, JSON.stringify(c));
}

export function clearCredentials(): void {
  localStorage.removeItem(CRED_KEY);
}

export function loadChats(idInstance: string): ChatMap {
  try {
    const raw = localStorage.getItem(chatsKey(idInstance));
    return raw ? (JSON.parse(raw) as ChatMap) : {};
  } catch {
    return {};
  }
}

export function saveChats(idInstance: string, chats: ChatMap): void {
  localStorage.setItem(chatsKey(idInstance), JSON.stringify(chats));
}
