// Fetches changed files from a public GitHub PR.
const PR_URL_RE = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:[/?#].*)?$/;

export function parsePrUrl(url) {
  const m = (url || '').trim().match(PR_URL_RE);
  if (!m) return null;
  return { owner: m[1], repo: m[2], number: Number(m[3]) };
}

async function ghFetch(url) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'codeguard-ai' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const res = await fetch(url, { headers });
  if (res.status === 404) throw new Error('PR or repository not found (private repos not supported).');
  if (res.status === 403) throw new Error('GitHub rate limit reached — try again later.');
  if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
  return res.json();
}

export async function fetchPrFiles(prUrl) {
  const parts = parsePrUrl(prUrl);
  if (!parts) throw new Error('Invalid GitHub PR URL. Expected https://github.com/owner/repo/pull/123');

  const { owner, repo, number } = parts;
  const files = await ghFetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}/files?per_page=100`);
  const pr = await ghFetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`);
  const headSha = pr.head?.sha;

  const enriched = await Promise.all(files.map(async (f) => {
    let content = '';
    if (headSha && f.status !== 'removed') {
      try {
        const contents = await ghFetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(f.filename)}?ref=${headSha}`);
        if (contents.content) {
          content = Buffer.from(contents.content, 'base64').toString('utf-8');
        }
      } catch {
        content = '';
      }
    }
    return { filename: f.filename, patch: f.patch || '', content, status: f.status };
  }));

  return {
    owner, repo, number,
    title: pr.title || '',
    files: enriched,
  };
}
