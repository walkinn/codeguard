import { analyzeCode } from '../server/src/services/analyzer.js';

export const config = { runtime: 'edge' };

const VALID_CATEGORIES = ['security', 'bugs', 'performance', 'style'];

function sanitizeCategories(input) {
  if (!Array.isArray(input) || input.length === 0) return [...VALID_CATEGORIES];
  const filtered = input.filter((c) => VALID_CATEGORIES.includes(c));
  return filtered.length ? filtered : [...VALID_CATEGORIES];
}

function jsonResponse(status, obj) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed.' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', Allow: 'POST' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body.' });
  }

  const { code, language, categories } = body || {};
  if (typeof code !== 'string' || !code.trim()) {
    return jsonResponse(400, { error: 'Field "code" is required.' });
  }
  if (code.length > 200_000) {
    return jsonResponse(413, { error: 'Code too large (max ~200KB).' });
  }

  const encoder = new TextEncoder();
  const sanitizedCategories = sanitizeCategories(categories);

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      const write = (obj) => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`)); } catch { /* connection dropped */ }
      };
      const heartbeat = setInterval(() => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(': heartbeat\n\n')); } catch { /* connection dropped */ }
      }, 10_000);

      let charsStreamed = 0;
      let lastProgressAt = 0;

      try {
        const result = await analyzeCode({
          code,
          language: language || 'auto',
          categories: sanitizedCategories,
          onDelta: (chunk) => {
            if (typeof chunk === 'string') charsStreamed = chunk.length;
            else charsStreamed += (chunk?.length || 0);
            const now = Date.now();
            if (now - lastProgressAt >= 500) {
              lastProgressAt = now;
              write({ type: 'progress', chars: charsStreamed });
            }
          },
        });
        write({ type: 'done', result });
      } catch (err) {
        console.error('[api/review]', err);
        write({ type: 'error', error: err?.message || 'Analysis failed.' });
      } finally {
        clearInterval(heartbeat);
        closed = true;
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
