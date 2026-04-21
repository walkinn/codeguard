// Fetches a public GitHub PR's diff and lets the user pick a file to load into the editor.
import { useState } from 'react';

const PR_URL_RE = /^https?:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/;

export default function GitHubPRInput({ onFileSelected, disabled }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');

  const valid = PR_URL_RE.test(url);

  const fetchPr = async () => {
    if (!valid) return;
    setLoading(true);
    setError(null);
    setFiles([]);
    try {
      const m = url.match(/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
      const [, owner, repo, number] = m;
      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}/files?per_page=50`);
      if (res.status === 404) throw new Error('PR not found (private repos not supported).');
      if (res.status === 403) throw new Error('GitHub rate limit — try later.');
      if (!res.ok) throw new Error(`GitHub API returned ${res.status}`);
      const list = await res.json();
      const pr = await fetch(`https://api.github.com/repos/${owner}/${repo}/pulls/${number}`).then(r => r.json());
      const sha = pr.head?.sha;

      const reviewable = list.filter(f => f.status !== 'removed');
      const enriched = await Promise.all(reviewable.map(async (f) => {
        try {
          const contents = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(f.filename)}?ref=${sha}`).then(r => r.json());
          const text = contents.content ? atob(contents.content.replace(/\n/g, '')) : '';
          return { filename: f.filename, content: text };
        } catch {
          return { filename: f.filename, content: '' };
        }
      }));

      setFiles(enriched);
      if (enriched[0]) setSelectedFile(enriched[0].filename);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFile = () => {
    const file = files.find(f => f.filename === selectedFile);
    if (file) onFileSelected(file);
  };

  return (
    <div className="flex flex-col gap-4 p-5 glass h-full">
      <div>
        <label className="text-[10px] uppercase tracking-wider text-white/40 font-medium block mb-2">
          GitHub PR URL
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="https://github.com/owner/repo/pull/123"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={disabled || loading}
            className="flex-1 glass-input"
          />
          <button
            onClick={fetchPr}
            disabled={!valid || loading || disabled}
            className="btn-primary whitespace-nowrap"
          >
            {loading ? 'Fetching…' : 'Fetch PR'}
          </button>
        </div>
        {url && !valid && (
          <p className="text-[11px] text-cat-security/90 mt-2">URL must match github.com/owner/repo/pull/number</p>
        )}
      </div>

      {error && (
        <div className="text-xs text-white/80 bg-cat-security/5 border-l-2 border-cat-security/60 px-3 py-2 rounded">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-[10px] uppercase tracking-wider text-white/40 font-medium">
            Select file ({files.length} changed)
          </label>
          <select
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
            className="glass-select"
            style={{ padding: '8px 12px', borderRadius: '8px' }}
          >
            {files.map(f => (
              <option key={f.filename} value={f.filename}>{f.filename}</option>
            ))}
          </select>
          <button onClick={applyFile} className="btn-primary mt-1">
            Load into editor
          </button>
        </div>
      )}

      {files.length === 0 && !error && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-white/35 text-center max-w-xs">
            Paste a public GitHub PR URL to fetch its changed files.
          </p>
        </div>
      )}
    </div>
  );
}
