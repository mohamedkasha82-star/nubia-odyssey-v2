import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 3000);
const nvidiaUrl = 'https://integrate.api.nvidia.com/v1/chat/completions';
const contentTypes = { '.html': 'text/html; charset=utf-8', '.json': 'application/json; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };

function send(res, status, body, type = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
  res.end(body);
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 32_000) throw new Error('payload too large');
  }
  return JSON.parse(raw || '{}');
}

async function handleNvidia(req, res) {
  if (req.method !== 'POST') return send(res, 405, JSON.stringify({ error: 'method not allowed' }));
  const key = process.env.NVIDIA_API_KEY;
  if (!key) return send(res, 503, JSON.stringify({ error: 'NVIDIA_API_KEY is not configured' }));
  let input;
  try { input = await readJson(req); } catch { return send(res, 400, JSON.stringify({ error: 'invalid JSON' })); }
  const message = String(input.message || '').trim();
  if (!message) return send(res, 400, JSON.stringify({ error: 'message is required' }));
  const system = [
    'You are Nubia AI, a careful Arabic cultural-heritage research assistant.',
    'Answer in Arabic unless asked otherwise.',
    'Distinguish archaeological evidence, written sources, and oral history.',
    'Never invent citations, pronunciation, village history, or community ownership claims.',
    'State uncertainty and recommend community review for living heritage.',
    'Keep answers useful and concise.'
  ].join(' ');
  try {
    let models = [...new Set([process.env.NVIDIA_MODEL, 'deepseek-ai/deepseek-v4-flash', 'nvidia/llama-3.3-nemotron-super-49b-v1.5', 'meta/llama-3.3-70b-instruct'].filter(Boolean))];
    try {
      const catalog = await fetch('https://integrate.api.nvidia.com/v1/models', { headers: { Authorization: `Bearer ${key}` } });
      if (catalog.ok) {
        const live = await catalog.json();
        const liveModels = (live.data || []).map(item => item.id).filter(Boolean);
        models = [...new Set(['deepseek-ai/deepseek-v4.1-flash', 'nvidia/nemotron-3-super-120b-a12b', ...liveModels, ...models])];
      }
    } catch {}
    let lastError = null;
    for (const model of models) {
      try {
        const upstream = await fetch(nvidiaUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` }, body: JSON.stringify({ model, messages: [{ role: 'system', content: system }, { role: 'user', content: message }], temperature: 0.2, max_tokens: 700 }) });
        const raw = await upstream.text();
        let data = {};
        try { data = JSON.parse(raw); } catch { data = { detail: raw.slice(0, 180) }; }
        if (upstream.ok && data?.choices?.[0]?.message?.content) return send(res, 200, JSON.stringify({ answer: data.choices[0].message.content }));
        lastError = { status: upstream.status, message: data?.error?.message || data?.detail || 'NVIDIA request failed' };
        if (![404, 410].includes(upstream.status)) break;
      } catch (error) { lastError = { status: 502, message: 'NVIDIA connection failed' }; }
    }
    return send(res, lastError?.status || 502, JSON.stringify({ error: lastError?.message || 'NVIDIA request failed' }));
  } catch (error) {
    return send(res, 502, JSON.stringify({ error: 'NVIDIA upstream unavailable' }));
  }
}

async function handleNvidiaModels(req, res) {
  if (req.method !== 'GET') return send(res, 405, JSON.stringify({ error: 'method not allowed' }));
  const key = process.env.NVIDIA_API_KEY;
  if (!key) return send(res, 503, JSON.stringify({ error: 'NVIDIA_API_KEY is not configured' }));
  try {
    const upstream = await fetch('https://integrate.api.nvidia.com/v1/models', { headers: { Authorization: `Bearer ${key}` } });
    const data = await upstream.json();
    return send(res, upstream.ok ? 200 : upstream.status, JSON.stringify({ models: (data.data || []).map(item => item.id).filter(Boolean) }));
  } catch { return send(res, 502, JSON.stringify({ error: 'NVIDIA catalog unavailable' })); }
}

async function handleStatic(req, res) {
  const pathname = (req.url || '/').split('?')[0];
  const requested = pathname === '/' ? '/index.html' : pathname;
  const safe = normalize(requested).replace(/^([/\\])+/, '');
  if (safe.includes('..')) return send(res, 400, JSON.stringify({ error: 'invalid path' }));
  try {
    const body = await readFile(join(root, safe));
    return send(res, 200, body, contentTypes[extname(safe)] || 'application/octet-stream');
  } catch { return send(res, 404, 'Not found', 'text/plain; charset=utf-8'); }
}

const server = http.createServer(async (req, res) => {
  if (req.url?.split('?')[0] === '/healthz') return send(res, 200, JSON.stringify({ ok: true, service: 'nubia-odyssey' }));
  if (req.url?.split('?')[0] === '/api/nvidia/models') return handleNvidiaModels(req, res);
  if (req.url?.split('?')[0] === '/api/nvidia/chat') return handleNvidia(req, res);
  return handleStatic(req, res);
});
server.listen(port, '0.0.0.0', () => console.log(`Nubia Odyssey listening on ${port}`));
