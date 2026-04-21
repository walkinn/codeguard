import { analyzeCode } from '../../server/src/services/analyzer.js';
import { fetchPrFiles } from '../../server/src/services/github.js';

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
    const { prUrl, categories } = req.body || {};
    if (!prUrl) return res.status(400).json({ error: 'Field "prUrl" is required.' });

    const pr = await fetchPrFiles(prUrl);
    const cats = sanitizeCategories(categories);

    const reviewable = pr.files.filter((f) => f.content && f.status !== 'removed').slice(0, 5);
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

    res.status(200).json({
      pr: { owner: pr.owner, repo: pr.repo, number: pr.number, title: pr.title },
      files: fileResults,
    });
  } catch (err) {
    console.error('[api/review/github]', err);
    res.status(500).json({ error: err.message || 'GitHub review failed.' });
  }
}
