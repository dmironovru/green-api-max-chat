/** Оставляем только цифры — это chatId в GREEN-API. */
export function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, '');
}

/** +79991234567 -> +7 (999) 123-45-67, остальное -> +<цифры>. */
export function formatPhone(chatId: string): string {
  if (/^8\d{10}$/.test(chatId)) return formatPhone(`7${chatId.slice(1)}`);
  if (/^7\d{10}$/.test(chatId)) {
    return `+7 (${chatId.slice(1, 4)}) ${chatId.slice(4, 7)}-${chatId.slice(7, 9)}-${chatId.slice(9)}`;
  }
  return `+${chatId}`;
}

export function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}