// Handles the API call, loading, and error state for a single review run.
import { useCallback, useState } from 'react';

export function useReview() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const runReview = useCallback(async ({ code, language, categories }) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language, categories }),
      });
      const text = await res.text();
      if (!text) {
        throw new Error(`Server returned an empty response (HTTP ${res.status}). The analysis may have timed out — try again.`);
      }
      let body;
      try { body = JSON.parse(text); }
      catch { throw new Error(`Server returned an invalid response (HTTP ${res.status}). Check the server terminal for errors.`); }
      if (!res.ok) throw new Error(body.error || `HTTP ${res.status}`);
      setResult(body);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
  }, []);

  return { loading, result, error, runReview, runGithubReview, reset, setResult };
}
