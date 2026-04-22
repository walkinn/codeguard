import { analyzeCode } from '../server/src/services/analyzer.js';

const VALID_CATEGORIES = ['security', 'bugs', 'performance', 'style'];

function sanitizeCategories(input) {
  if (!Array.isArray(input) || input.length === 0) return [...VALID_CATEGORIES];
  const filtered = input.filter((c) => VALID_CATEGORIES.includes(c));
  return filtered.length ? filtered : [...VALID_CATEGORIES];
}

export const config = { maxDuration: 60 };

function writeFrame(res, payload) {
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { code, language, categories } = req.body || {};
  if (typeof code !== 'string' || !code.trim()) {
    return res.status(400).json({ error: 'Field "code" is required.' });
  }
  if (code.length > 200_000) {
    return res.status(413).json({ error: 'Code too large (max ~200KB).' });
  }

  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  if (typeof res.flushHeaders === 'function') res.flushHeaders();

  let charsStreamed = 0;
  let lastProgressAt = 0;
  const heartbeat = setInterval(() => {
    try { res.write(': heartbeat\n\n'); } catch { /* connection closed */ }
  }, 10_000);

  try {
    const result = await analyzeCode({
      code,
      language: language || 'auto',
      categories: sanitizeCategories(categories),
      onDelta: (chunk) => {
        charsStreamed += chunk.length;
        const now = Date.now();
        if (now - lastProgressAt >= 500) {
          lastProgressAt = now;
          writeFrame(res, { type: 'progress', chars: charsStreamed });
        }
      },
    });

    writeFrame(res, { type: 'done', result });
  } catch (err) {
    console.error('[api/review]', err);
    writeFrame(res, { type: 'error', error: err.message || 'Analysis failed.' });
  } finally {
    clearInterval(heartbeat);
    res.end();
  }
}
