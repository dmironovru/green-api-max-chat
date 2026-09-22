# 🟢 GREEN-API MAX Chat

Веб-чат для отправки и получения текстовых сообщений в мессенджере MAX через [GREEN-API](https://green-api.com). Тестовое задание на позицию Frontend-разработчик (React).

![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-6-blue)
![Vite](https://img.shields.io/badge/Vite-8-purple)
![License: MIT](https://img.shields.io/badge/License-MIT-green)

## 🚀 Демо
**Открыть приложение:** https://green-api-max-chat.vercel.app 

**Видео-демо (16 сек):** https://dmitrymironov.ru/uploads/media/greenchatapi.mp4

Введите свои `idInstance` и `apiTokenInstance` из [кабинета GREEN-API](https://console.green-api.com), создайте чат по номеру телефона и начните переписку.

## 📸 Скриншоты

**Форма подключения**

<img src="docs/screenshots/01-login.png" alt="Форма подключения" width="800" />

**Диалог со статусами доставки**

<img src="docs/screenshots/02-chat.png" alt="Диалог" width="800" />

## ✅ Требования тестового задания

| # | Требование | Реализация |
|---|---|---|
| 1 | Веб-приложение для отправки и получения сообщений в MAX | ✅ React + TypeScript SPA |
| 2 | Отправка текстовых сообщений (`SendMessage`) | ✅ `src/api/greenApi.ts` → `sendMessage` |
| 3 | Получение сообщений (HTTP API или вебхуки) | ✅ Поллинг `receiveNotification` + `deleteNotification`, `src/hooks/useIncoming.ts` |
| 4 | Интерфейс в стиле web.max.ru | ✅ Сайдбар + окно чата, пузыри, аватары |
| 5 | Авторизация через `idInstance` + `apiTokenInstance` | ✅ `LoginForm`, хранение в `localStorage` |
| 6 | История сообщений между сессиями | ✅ `src/lib/storage.ts` |
| 7 | Статусы доставки | ✅ ⏳ → ✓ → ✓✓ → ✓✓ (прочитано) через `outgoingMessageStatus` |
| 8 | Адаптивный дизайн | ✅ CSS Grid + media queries |

## 🛠 Стек

- **React 19** + **TypeScript** (без `any`)
- **Vite** (dev-сервер с CORS-прокси, HMR)
- **Чистый CSS** (без UI-библиотек)
- **localStorage** — история чатов и креды
- **GREEN-API** — REST API мессенджера MAX

## 🏗 Архитектура

### Почему поллинг, а не вебхуки

Тестовое задание — про фронтенд. Вебхукам нужен бэкенд, который примет POST от GREEN-API и перешлёт его в браузер. Поллинг очереди `receiveNotification` — pure frontend, работает на статическом хостинге.

Схема цикла: `receiveNotification` → обработка → `deleteNotification` → пауза 5 с → повтор.

### CORS и прокси

GREEN-API не отдаёт `Access-Control-Allow-Origin` для браузеров. Локально используется **Vite dev proxy**, браузер ходит на свой origin.

```ts
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'https://3100.api.green-api.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, ''),
    },
  },
}
```

### chatId ≠ номер телефона

В MAX `chatId` — внутренний ID аккаунта (например, `91543512`), а не номер телефона. Перед созданием чата вызывается `checkAccount`, из ответа берётся `chatId`, и только потом открывается диалог.

```ts
const account = await checkAccount(credentials, phone);
const chatId = String(account.chatId);
```

## 🕳 Грабли и решения

### 1. Пустое тело ответа `receiveNotification`

При пустой очереди GREEN-API возвращает пустую строку, а не `[]` или `null`. `res.json()` падает с `Unexpected end of JSON input`. Решение: читаем `res.text()`, проверяем на пустоту, потом парсим.

### 2. Структура уведомлений MAX

В MAX текст приходит как `messageData.extendedTextMessageData.text`, а не `textMessageData.textMessage`, как в WhatsApp. В парсере — перебор вариантов с защитой от `undefined`.

### 3. Кластерные хосты

Каждому инстансу выдаётся свой `apiUrl` (например, `https://3100.api.green-api.com`). В форме есть поле `apiUrl`; если оставить пустым — хост выводится из первых 4 цифр `idInstance`.

## 🚀 Запуск локально

```bash
git clone https://github.com/dmironovru/green-api-max-chat.git
cd green-api-max-chat
npm install
npm run dev
# открыть http://localhost:5173
```

Введите `idInstance`, `apiTokenInstance`, `apiUrl` (можно оставить пустым — выведется из `idInstance`) из [кабинета GREEN-API](https://console.green-api.com).

## 🔒 Безопасность

- `apiTokenInstance` хранится **только** в `localStorage` браузера пользователя и никогда не коммитится.
- В этом прототипе токен уходит напрямую в GREEN-API через dev-прокси. **В проде токен уводится за бэкенд-прокси**, чтобы не светить его в браузере.
- Перед публикацией скриншотов и видео замазывайте `idInstance`, `apiTokenInstance`, номера телефонов и имена контактов.

## 📝 License

MIT