// Root layout — input/editor on the left, results on the right, with a draggable divider.
import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import CodeEditor from './components/CodeEditor.jsx';
import GitHubPRInput from './components/GitHubPRInput.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';
import AboutPage from './components/AboutPage.jsx';
import { useReview } from './hooks/useReview.js';
import { EXAMPLE_CODE, EXAMPLE_LANGUAGE } from './utils/exampleCode.js';

const CATEGORY_TOGGLES = [
  { key: 'security', label: 'Security', icon: '🔒', accent: 'text-severity-critical' },
  { key: 'bugs', label: 'Bugs', icon: '🐛', accent: 'text-severity-high' },
  { key: 'performance', label: 'Performance', icon: '⚡', accent: 'text-severity-medium' },
  { key: 'style', label: 'Style', icon: '✨', accent: 'text-severity-low' },
];

export default function App() {
  const [page, setPage] = useState('review');
  const [activeTab, setActiveTab] = useState('paste');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('auto');
  const [categories, setCategories] = useState({ security: true, bugs: true, performance: true, style: true });
  const [cooldown, setCooldown] = useState(false);
  const [splitPct, setSplitPct] = useState(50);
  const [toast, setToast] = useState(null);
  const [dragging, setDragging] = useState(false);

  const editorRef = useRef(null);
  const shellRef = useRef(null);
  const { loading, result, error, runReview } = useReview();

  const enabledCategories = Object.entries(categories).filter(([, v]) => v).map(([k]) => k);
  const canRun = code.trim().length > 0 && enabledCategories.length > 0 && !loading && !cooldown;
  const lineCount = code ? code.split('\n').length : 0;

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }, []);

  const handleRun = async () => {
    if (!canRun) return;
    setCooldown(true);
    setTimeout(() => setCooldown(false), 3000);
    await runReview({ code, language, categories: enabledCategories });
  };

  const handleLoadExample = () => {
    setCode(EXAMPLE_CODE);
    setLanguage(EXAMPLE_LANGUAGE);
    editorRef.current?.setValue(EXAMPLE_CODE);
    showToast('Loaded vulnerable Flask example');
  };

  const handleLineClick = (start, end) => {
    editorRef.current?.highlightLines(start, end || start);
  };

  const handleApplyFix = (issue, fix) => {
    if (!editorRef.current || !fix?.code) return;
    editorRef.current.replaceRange(issue.line_start, issue.line_end || issue.line_start, fix.code);
    setCode(editorRef.current.getValue());
  };

  const handleApplyAllFixes = () => {
    if (!result?.issues || !editorRef.current) return;
    const sorted = [...result.issues].sort((a, b) => (b.line_start || 0) - (a.line_start || 0));
    for (const issue of sorted) {
      const fix = issue.fixes?.[0];
      if (!fix?.code) continue;
      editorRef.current.replaceRange(issue.line_start, issue.line_end || issue.line_start, fix.code);
    }
    setCode(editorRef.current.getValue());
    showToast(`Applied ${sorted.length} fix${sorted.length === 1 ? '' : 'es'}`);
  };

  const handleGithubFile = (file) => {
    setCode(file.content);
    setActiveTab('paste');
    editorRef.current?.setValue(file.content);
    showToast(`Loaded ${file.filename}`);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e) => {
      const rect = shellRef.current?.getBoundingClientRect();
      if (!rect) return;
      const pct = ((e.clientX - rect.left) / rect.width) * 100;
      setSplitPct(Math.max(25, Math.min(75, pct)));
    };
    const onUp = () => setDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragging]);

  return (
    <div className="h-full flex flex-col bg-bg-base">
      <Header currentPage={page} onNavigate={setPage} />

      {page === 'about' ? (
        <div className="flex-1 overflow-auto">
          <AboutPage />
        </div>
      ) : (
        <div ref={shellRef} className="flex-1 flex flex-col md:flex-row min-h-0">
          {/* Left: input/editor */}
          <div
            className="flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-border-subtle"
            style={{ width: `min(100%, ${splitPct}%)`, flex: 'none' }}
          >
            <div className="flex border-b border-border-subtle bg-bg-card">
              <button
                onClick={() => setActiveTab('paste')}
                className={`px-4 py-2 text-sm transition ${activeTab === 'paste' ? 'tab-active' : 'tab-inactive'}`}
              >Paste Code</button>
              <button
                onClick={() => setActiveTab('github')}
                className={`px-4 py-2 text-sm transition ${activeTab === 'github' ? 'tab-active' : 'tab-inactive'}`}
              >GitHub PR</button>
            </div>

            <div className="flex items-center gap-3 px-4 py-2 bg-bg-card border-b border-border-subtle flex-wrap">
              {CATEGORY_TOGGLES.map(t => (
                <label key={t.key} className="flex items-center gap-1.5 text-xs cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={categories[t.key]}
                    onChange={(e) => setCategories({ ...categories, [t.key]: e.target.checked })}
                    className="accent-accent w-3.5 h-3.5"
                  />
                  <span className={categories[t.key] ? t.accent : 'text-gray-500'}>
                    {t.icon} {t.label}
                  </span>
                </label>
              ))}
            </div>

            <div className="flex-1 min-h-0 p-3">
              {activeTab === 'paste' ? (
                <CodeEditor
                  ref={editorRef}
                  value={code}
                  onChange={setCode}
                  language={language}
                  onLanguageChange={setLanguage}
                />
              ) : (
                <GitHubPRInput onFileSelected={handleGithubFile} disabled={loading} />
              )}
            </div>

            <div className="flex items-center justify-between gap-2 p-3 bg-bg-card border-t border-border-subtle flex-wrap">
              <span className="text-xs text-gray-400">
                {lineCount} line{lineCount === 1 ? '' : 's'}
              </span>
              <div className="flex gap-2">
                <button onClick={handleLoadExample} disabled={loading} className="btn-secondary text-sm">
                  Load Example
                </button>
                <button
                  onClick={handleRun}
                  disabled={!canRun}
                  className="btn-primary text-sm inline-flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                  </svg>
                  {loading ? 'Running…' : cooldown ? 'Wait…' : 'Run Review'}
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div
            onMouseDown={() => setDragging(true)}
            className={`hidden md:block w-1 divider-drag ${dragging ? 'dragging' : ''}`}
            role="separator"
            aria-orientation="vertical"
          />

          {/* Right: results */}
          <div className="flex-1 min-h-0 min-w-0 bg-bg-base">
            {error && (
              <div className="m-4 p-3 rounded-lg bg-severity-critical/10 border border-severity-critical/30 text-sm text-red-300">
                {error}
              </div>
            )}
            <ResultsPanel
              result={result}
              loading={loading}
              linesAnalyzed={lineCount}
              onLineClick={handleLineClick}
              onApplyFix={handleApplyFix}
              onApplyAllFixes={handleApplyAllFixes}
              onToast={showToast}
            />
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-bg-elevated border border-accent/40 text-white px-4 py-2 rounded-full text-sm shadow-lg animate-fade-in-up z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
