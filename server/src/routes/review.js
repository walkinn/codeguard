// POST /api/review and POST /api/review/github — drives the analysis pipeline.
import { Router } from 'express';
import { analyzeCode } from '../services/analyzer.js';
import { fetchPrFiles } from '../services/github.js';

const router = Router();

const VALID_CATEGORIES = ['security', 'bugs', 'performance', 'style'];

function sanitizeCategories(input) {
  if (!Array.isArray(input) || input.length === 0) return [...VALID_CATEGORIES];
  const filtered = input.filter(c => VALID_CATEGORIES.includes(c));
  return filtered.length ? filtered : [...VALID_CATEGORIES];
}

router.post('/', async (req, res) => {
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
    res.json(result);
  } catch (err) {
    console.error('[review]', err);
    res.status(500).json({ error: err.message || 'Analysis failed.' });
  }
});

router.post('/github', async (req, res) => {
  try {
    const { prUrl, categories } = req.body || {};
    if (!prUrl) return res.status(400).json({ error: 'Field "prUrl" is required.' });

    const pr = await fetchPrFiles(prUrl);
    const cats = sanitizeCategories(categories);

    const reviewable = pr.files.filter(f => f.content && f.status !== 'removed').slice(0, 5);
    if (reviewable.length === 0) {
      return res.status(400).json({ error: 'No reviewable files found in this PR.' });
    }

    const fileResults = [];
    for (const file of reviewable) {
      try {
        const result = await analyzeCode({ code: file.content, language: 'auto', categories: cats });
        fileResults.push({ filename: file.filename, ...result });
      } catch (err) {
        fileResults.push({ filename: file.filename, error: err.message });
      }
    }

    res.json({
      pr: { owner: pr.owner, repo: pr.repo, number: pr.number, title: pr.title },
      files: fileResults,
    });
  } catch (err) {
    console.error('[review/github]', err);
    res.status(500).json({ error: err.message || 'GitHub review failed.' });
  }
});

export default router;
