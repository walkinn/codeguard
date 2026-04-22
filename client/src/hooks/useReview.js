// Handles the API call, loading, and error state for a single review run.
import { useCallback, useState } from 'react';

async function consumeReviewStream(res, { onProgress } = {}) {
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('text/event-stream')) {
    // Old non-streaming path (local dev or prior deploy): parse as JSON.
    const text = await res.text();
    if (!text) {
      throw new Error(`Server returned an empty response (HTTP ${res.status}). The analysis may have timed out — try again.`);
    }
    let body;
    try { body = JSON.parse(text); }
    catch { throw new Error(`Server returned an invalid response (HTTP ${res.status}). Check the server terminal for errors.`); }
    if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
    return body;
  }

  if (!res.body || typeof res.body.getReader !== 'function') {
    throw new Error('Streaming is not supported in this browser.');
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let result = null;
  let streamError = null;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let sep;
    while ((sep = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      const dataLines = frame
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trimStart());
      if (dataLines.length === 0) continue; // heartbeat or comment
      const payloadText = dataLines.join('\n');
      let payload;
      try { payload = JSON.parse(payloadText); } catch { continue; }
      if (payload.type === 'progress') {
        onProgress?.(payload);
      } else if (payload.type === 'done') {
        result = payload.result;
      } else if (payload.type === 'error') {
        streamError = payload.error || 'Analysis failed.';
      }
    }
  }

  if (streamError) throw new Error(streamError);
  if (!result) throw new Error('Stream ended without a result.');
  return result;
}

export function useReview() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);

  const runReview = useCallback(async ({ code, language, categories }) => {
    setLoading(true);
    setError(null);
    setResult(null);
    setProgress(null);
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ code, language, categories }),
      });
      if (!res.ok && !(res.headers.get('content-type') || '').includes('text/event-stream')) {
        const text = await res.text();
        let msg = `HTTP ${res.status}`;
        try { msg = (JSON.parse(text).error) || msg; } catch { /* keep default */ }
        throw new Error(msg);
      }
      const body = await consumeReviewStream(res, {
        onProgress: (p) => setProgress(p),
      });
      setResult(body);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setProgress(null);
    }
  }, []);

  const runGithubReview = useCallback(async ({ prUrl, categories }) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/review/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prUrl, categories }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      return body;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
    setLoading(false);
    setProgress(null);
  }, []);

  return { loading, progress, result, error, runReview, runGithubReview, reset, setResult };
}
