// Root layout — tool is the landing page. No hero, no background orbs, straight to work.
import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './components/Header.jsx';
import CodeEditor from './components/CodeEditor.jsx';
import GitHubPRInput from './components/GitHubPRInput.jsx';
import ResultsPanel from './components/ResultsPanel.jsx';
import AboutPage from './components/AboutPage.jsx';
import { useReview } from './hooks/useReview.js';
import { EXAMPLE_CODE, EXAMPLE_LANGUAGE } from './utils/exampleCode.js';

const CATEGORY_TOGGLES = [
  { key: 'security', label: 'Security', cat: 'cat-security' },
  { key: 'bugs', label: 'Bugs', cat: 'cat-bugs' },
  { key: 'performance', label: 'Performance', cat: 'cat-performance' },
  { key: 'style', label: 'Style', cat: 'cat-style' },
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
    <div className="h-screen flex flex-col text-white bg-black">
      <Header currentPage={page} onNavigate={setPage} />

      {page === 'about' ? (
        <main className="flex-1 overflow-auto">
          <AboutPage />
        </main>
      ) : (
        <section className="flex-1 flex flex-col min-h-0 px-4 pb-4 pt-4">
          <div ref={shellRef} className="flex-1 flex flex-col md:flex-row min-h-0 glass overflow-hidden">
            {/* Left: input/editor */}
            <div
              className="flex flex-col min-h-0 border-b md:border-b-0 md:border-r border-white/6"
              style={{ width: `min(100%, ${splitPct}%)`, flex: 'none' }}
            >
              <div className="flex gap-1 p-2 border-b border-white/6">
                {[
                  { k: 'paste', label: 'Paste Code' },
                  { k: 'github', label: 'GitHub PR' },
                ].map(t => (
                  <button
                    key={t.k}
                    onClick={() => setActiveTab(t.k)}
                    className={`px-3.5 py-1 rounded-full text-xs font-medium transition ${
                      activeTab === t.k ? 'tab-active' : 'tab-inactive'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 px-3 py-2.5 border-b border-white/6 flex-wrap">
                <span className="text-[10px] uppercase tracking-wider text-white/35 mr-1">Checks</span>
                {CATEGORY_TOGGLES.map(t => (
                  <label
                    key={t.key}
                    className={`toggle-pill ${t.cat} ${categories[t.key] ? 'on' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={categories[t.key]}
                      onChange={(e) => setCategories({ ...categories, [t.key]: e.target.checked })}
                      className="sr-only"
                    />
                    <span className="dot" />
                    <span>{t.label}</span>
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

              <div className="flex items-center justify-between gap-2 p-3 border-t border-white/6 flex-wrap">
                <span className="text-[11px] text-white/40">
                  {lineCount} line{lineCount === 1 ? '' : 's'}
                </span>
                <div className="flex gap-2">
                  <button onClick={handleLoadExample} disabled={loading} className="btn-secondary">
                    Load Example
                  </button>
                  <button
                    onClick={handleRun}
                    disabled={!canRun}
                    className="btn-primary"
                  >
                    {loading ? 'Running…' : cooldown ? 'Wait…' : 'Run Review'}
                  </button>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div
              onMouseDown={() => setDragging(true)}
              className={`hidden md:block w-px divider-drag ${dragging ? 'dragging' : ''}`}
              role="separator"
              aria-orientation="vertical"
            />

            {/* Right: results */}
            <div className="flex-1 min-h-0 min-w-0 flex flex-col">
              {error && (
                <div className="m-3 p-3 rounded-lg border border-cat-security/30 bg-cat-security/5 text-sm text-white/85">
                  {error}
                </div>
              )}
              <div className="flex-1 min-h-0">
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
          </div>
        </section>
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 glass-strong px-4 py-2 rounded-full text-xs text-white/90 z-50 animate-fade-in-up">
          {toast}
        </div>
      )}
    </div>
  );
}
