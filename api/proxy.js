/**
 * Vercel serverless-функция: CORS-прокси к GREEN-API.
 * Маршрут: /api/proxy?path=waInstance{id}/{method}/{token}
 * Целевой кластер передаётся в заголовке x-api-url (whitelist: *.api.green-api.com).
 */
const ALLOWED_HOST = /^https:\/\/(\d{4}\.)?api\.green-api\.com$/;

export default async function handler(req, res) {
  const path = req.query.path;
  const apiUrl = req.headers['x-api-url'];

  if (typeof path !== 'string' || !path) {
    return res.status(400).json({ error: 'path query parameter is required' });
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
