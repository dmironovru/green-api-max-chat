# 🟢 GREEN-API MAX Chat

Веб-чат для отправки и получения текстовых сообщений в мессенджере MAX через [GREEN-API](https://green-api.com). Тестовое задание на позицию Frontend-разработчик (React).

![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-6-blue)
![Vite](https://img.shields.io/badge/Vite-8-purple)
![License: MIT](https://img.shields.io/badge/License-MIT-green)

## 🚀 Демо

**Приложение:** https://green-api-max-chat.vercel.app

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

GREEN-API не отдаёт `Access-Control-Allow-Origin` для браузеров. Решение:

- **Локально (dev):** Vite dev proxy — браузер ходит на свой origin, прокси пересылает запросы на `*.api.green-api.com`
- **В проде:** serverless-функция `api/proxy.js` на Vercel с whitelist-валидацией заголовка `x-api-url`

```ts
// vite.config.ts (для локальной разработки)
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

### 4. Квота тарифа «Разработчик»

На бесплатном тарифе GREEN-API разрешено переписываться только с 3 чатами в месяц. Превышение — ошибка `466 CORRESPONDENTS_QUOTA_EXCEEDED`. Решение: дисциплина квоты — тестовый собеседник, «Избранное» для тестов, неприкосновенный запас.

## 🚀 Запуск локально

```bash
git clone https://github.com/dmironovru/green-api-max-chat.git
cd green-api-max-chat
npm install
npm run dev
# открыть http://localhost:5173
```

Введите `idInstance`, `apiTokenInstance`, `apiUrl` (можно оставить пустым — выведется из `idInstance`) из [кабинета GREEN-API](https://console.green-api.com).

## 🌐 Деплой

Проект задеплоен на **Vercel** с serverless-прокси для обхода CORS.

### Serverless-функция `api/proxy.js`

```javascript
const ALLOWED_HOST = /^https:\/\/(\d{4}\.)?api\.green-api\.com$/;
const ALLOWED_METHODS = new Set(['GET', 'POST', 'DELETE']);
const ALLOWED_PATH = /^waInstance\d+\/(sendMessage|receiveNotification|deleteNotification|checkAccount)\/[A-Za-z0-9\-]+(\/\d+)?(\?.*)?$/;

export default async function handler(req, res) {
  const path = req.query.path;
  const apiUrl = req.headers['x-api-url'];

  if (!ALLOWED_METHODS.has(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (typeof path !== 'string' || !ALLOWED_PATH.test(path)) {
    return res.status(400).json({ error: 'Invalid path format' });
  }

  if (typeof apiUrl !== 'string' || !ALLOWED_HOST.test(apiUrl)) {
    return res.status(400).json({ error: 'x-api-url must match https://<cluster>.api.green-api.com' });
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  try {
    const response = await fetch(`${apiUrl}/${path}`, {
      method: req.method,
      headers: hasBody ? { 'Content-Type': 'application/json' } : undefined,
      body: hasBody ? JSON.stringify(req.body ?? {}) : undefined,
    });
    const text = await response.text();
    res.status(response.status);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(text);
  } catch (e) {
    return res.status(502).json({ error: `proxy error: ${e.message}` });
  }
}
```

### Как работает

Каждый посетитель вводит свой `apiUrl` в форме логина, и прокси пересылает запросы на нужный кластер. Валидация по whitelist:

- `x-api-url` — только `*.api.green-api.com`
- `path` — только разрешённые методы GREEN-API
- HTTP методы — только `GET`, `POST`, `DELETE`

Это позволяет использовать приложение с **любым** инстансом MAX без хардкода кластера.

## 🔒 Безопасность

- `apiTokenInstance` хранится **только в `localStorage` браузера пользователя** и никогда не коммитится в репозиторий
- Каждый посетитель вводит **свои собственные** креды из своего кабинета GREEN-API — чужие токены недоступны
- Serverless-функция валидирует:
  - `x-api-url` по whitelist `*.api.green-api.com` (нельзя направить запрос на сторонний сервер)
  - `path` по whitelist методов GREEN-API (`sendMessage`, `receiveNotification`, `deleteNotification`, `checkAccount`)
  - HTTP методы только `GET`, `POST`, `DELETE`
- **Важно:** в этом прототипе токен вводится пользователем в форму и хранится в его localStorage. Прокси только обходит CORS. Для production-решения токен должен храниться на сервере (env-переменная), а браузер должен делать запросы без токена
- Перед публикацией скриншотов/видео замазывайте `idInstance`, `apiTokenInstance`, номера телефонов, имена контактов

## 📝 License

MIT

###

**Автор:** Дмитрий Миронов  
**Email:** [mdsdzr@gmail.com](mailto:mdsdzr@gmail.com)  
**GitHub:** [dmironovru](https://github.com/dmironovru)  
**Сайт:** [dmitrymironov.ru](https://dmitrymironov.ru)