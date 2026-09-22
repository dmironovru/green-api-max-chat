/**
 * Vercel serverless-функция: CORS-прокси к GREEN-API.
 * Маршрут: /api/* -> https://<cluster>.api.green-api.com/*
 * Кластер передаёт клиент заголовком x-api-url (whitelist: только *.api.green-api.com).
 */
const ALLOWED_HOST = /^https:\/\/(\d{4}\.)?api\.green-api\.com$/;

export default async function handler(req, res) {
  const slug = req.query.slug;
  const path = Array.isArray(slug) ? slug.join('/') : String(slug ?? '');
  const apiUrl = req.headers['x-api-url'];

  if (typeof apiUrl !== 'string' || !ALLOWED_HOST.test(apiUrl)) {
    res.setHeader('Content-Type', 'application/json');
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
