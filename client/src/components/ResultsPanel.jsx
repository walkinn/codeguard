// Full results view — score, severity breakdown, category tabs, issue list, action bar.
import { useMemo, useState } from 'react';
import ScoreCard from './ScoreCard.jsx';
import SeverityBar from './SeverityBar.jsx';
import IssueCard from './IssueCard.jsx';
import LoadingAnimation from './LoadingAnimation.jsx';
import { buildMarkdownReport, downloadMarkdown, buildTextSummary } from '../utils/exportReport.js';

const CATEGORIES = [
  { key: 'all',         label: 'All',         color: 'rgba(255,255,255,0.5)' },
  { key: 'security',    label: 'Security',    color: '#ff3b3b' },
  { key: 'bug',         label: 'Bugs',        color: '#ffcc00' },
  { key: 'performance', label: 'Performance', color: '#3b82f6' },
  { key: 'style',       label: 'Style',       color: '#a855f7' },
];

export default function ResultsPanel({ result, loading, linesAnalyzed, onLineClick, onApplyFix, onApplyAllFixes, onToast }) {
  const [severityFilter, setSeverityFilter] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categoryCounts = useMemo(() => {
    if (!result) return { security: 0, bug: 0, performance: 0, style: 0 };
    return {
      security: result.summary.security_issues || 0,
      bug: result.summary.bug_issues || 0,
      performance: result.summary.performance_issues || 0,
      style: result.summary.style_issues || 0,
    };
  }, [result]);

  const filteredIssues = useMemo(() => {
    if (!result) return [];
    return result.issues.filter(issue => {
      if (categoryFilter !== 'all' && issue.category !== categoryFilter) return false;
      if (severityFilter && issue.severity !== severityFilter) return false;
      return true;
    });
  }, [result, categoryFilter, severityFilter]);

  if (loading) {
    return (
      <div className="h-full">
        <LoadingAnimation linesAnalyzed={linesAnalyzed} />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8">
        <svg className="w-12 h-12 text-white/30 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" aria-hidden>
          <path d="M12 2 4 5v6c0 5 3.5 9.3 8 11 4.5-1.7 8-6 8-11V5l-8-3z" />
        </svg>
        <h2 className="text-sm font-medium text-white/85">Ready to audit</h2>
        <p className="text-xs mt-2 max-w-sm text-white/40 leading-relaxed">
          Paste code or a GitHub PR URL, pick which checks to run, and click Run Review.
        </p>
      </div>
    );
  }

  const issuesFound = result.issues.length;

  const handleDownload = () => {
    const md = buildMarkdownReport(result);
    downloadMarkdown(md, `codeguard-report-${Date.now()}.md`);
    onToast?.('Report downloaded');
  };
  const handleCopySummary = async () => {
    const text = buildTextSummary(result);
    try {
      await navigator.clipboard.writeText(text);
      onToast?.('Summary copied');
    } catch {
      onToast?.('Copy failed');
    }
  };

  return (
    <div className="h-full overflow-auto p-4 flex flex-col gap-4">
      <ScoreCard
        grade={result.overall_grade}
        score={result.overall_score}
        verdict={result.verdict}
        linesAnalyzed={result.lines_analyzed}
        issuesFound={issuesFound}
      />

      <SeverityBar
        summary={result.summary}
        activeFilter={severityFilter}
        onFilterChange={setSeverityFilter}
      />

      <div className="flex flex-wrap gap-1 glass p-1 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
        {CATEGORIES.map(cat => {
          const count = cat.key === 'all' ? issuesFound : categoryCounts[cat.key] || 0;
          const active = categoryFilter === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key)}
              className={`text-xs px-3 py-1 rounded-full transition border inline-flex items-center gap-1.5 ${
                active
                  ? 'bg-white/8 text-white border-white/20'
                  : 'text-white/50 border-transparent hover:text-white hover:bg-white/4'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {filteredIssues.length === 0 ? (
          <div className="text-xs text-white/40 text-center py-10 glass">
            No issues in this filter.
          </div>
        ) : (
          filteredIssues.map((issue, i) => (
            <IssueCard
              key={issue.id || i}
              issue={issue}
              index={i}
              onLineClick={onLineClick}
              onApplyFix={onApplyFix}
              onToast={onToast}
            />
          ))
        )}
      </div>

      <div className="sticky bottom-0 -mx-4 px-4 py-3 mt-auto bg-gradient-to-t from-black via-black/92 to-transparent">
        <div className="glass-strong px-3 py-2.5 flex flex-wrap gap-2 items-center" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <button onClick={onApplyAllFixes} className="btn-primary flex-1 min-w-[160px]">
            Apply All Fixes
          </button>
          <button onClick={handleDownload} className="btn-secondary">Download Report</button>
          <button onClick={handleCopySummary} className="btn-secondary">Copy Summary</button>
        </div>
      </div>
    </div>
  );
}
