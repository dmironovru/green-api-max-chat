/**
 * Vercel serverless-функция: CORS-прокси к GREEN-API.
 * Маршрут: /api/proxy?path=waInstance{id}/{method}/{token}[/receiptId]
 * Целевой кластер передаётся в заголовке x-api-url (whitelist: *.api.green-api.com).
 */

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
    // Не логируем e.message — он может содержать URL с apiTokenInstance
    console.error('proxy error:', e instanceof Error ? e.name : 'unknown');
    return res.status(502).json({ error: 'proxy error' });
  }
}
