import { analyzeCode } from '../server/src/services/analyzer.js';

const VALID_CATEGORIES = ['security', 'bugs', 'performance', 'style'];

function sanitizeCategories(input) {
  if (!Array.isArray(input) || input.length === 0) return [...VALID_CATEGORIES];
  const filtered = input.filter((c) => VALID_CATEGORIES.includes(c));
  return filtered.length ? filtered : [...VALID_CATEGORIES];
}

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }
  try {
    const { code, language, categories } = req.body || {};
    if (typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ error: 'Field "code" is required.' });
    }
    if (code.length > 200_000) {
      return res.status(413).json({ error: 'Code too large (max ~200KB).' });
    }
    const result = await analyzeCode({
      code,
      language: language || 'auto',
      categories: sanitizeCategories(categories),
    });
    res.status(200).json(result);
  } catch (err) {
    console.error('[api/review]', err);
    res.status(500).json({ error: err.message || 'Analysis failed.' });
  }
}
