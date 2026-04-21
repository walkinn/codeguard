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
    <div className="flex flex-col gap-3 p-4 bg-bg-card rounded-lg border border-border-subtle">
      <label className="text-sm font-medium text-gray-300">
        GitHub PR URL
        <div className="flex gap-2 mt-2">
          <input
            type="text"
            placeholder="https://github.com/owner/repo/pull/123"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={disabled || loading}
            className="flex-1 bg-bg-elevated border border-border-subtle rounded px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <button
            onClick={fetchPr}
            disabled={!valid || loading || disabled}
            className="btn-primary text-sm"
          >
            {loading ? 'Fetching…' : 'Fetch PR'}
          </button>
        </div>
        {url && !valid && (
          <p className="text-xs text-severity-high mt-1">URL must match github.com/owner/repo/pull/number</p>
        )}
      </label>

      {error && (
        <div className="text-sm text-severity-high bg-severity-critical/10 border border-severity-critical/30 rounded px-3 py-2">
          {error}
        </div>
      )}

      {files.length > 0 && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-300">
            Select file to review ({files.length} changed)
          </label>
          <select
            value={selectedFile}
            onChange={(e) => setSelectedFile(e.target.value)}
            className="bg-bg-elevated border border-border-subtle rounded px-3 py-2 text-sm text-white"
          >
            {files.map(f => (
              <option key={f.filename} value={f.filename}>{f.filename}</option>
            ))}
          </select>
          <button onClick={applyFile} className="btn-primary text-sm">
            Load into editor
          </button>
        </div>
      )}
    </div>
  );
}
