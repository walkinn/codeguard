// Full results view — score, severity breakdown, category tabs, issue list, action bar.
import { useMemo, useState } from 'react';
import ScoreCard from './ScoreCard.jsx';
import SeverityBar from './SeverityBar.jsx';
import IssueCard from './IssueCard.jsx';
import LoadingAnimation from './LoadingAnimation.jsx';
import { buildMarkdownReport, downloadMarkdown, buildTextSummary } from '../utils/exportReport.js';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: '📋' },
  { key: 'security', label: 'Security', icon: '🔒' },
  { key: 'bug', label: 'Bugs', icon: '🐛' },
  { key: 'performance', label: 'Performance', icon: '⚡' },
  { key: 'style', label: 'Style', icon: '✨' },
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
      <div className="h-full overflow-auto">
        <LoadingAnimation linesAnalyzed={linesAnalyzed} />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8 text-gray-400">
        <svg className="w-16 h-16 text-gray-600 mb-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
        </svg>
        <h2 className="text-lg font-medium text-white">Ready to audit</h2>
        <p className="text-sm mt-1 max-w-sm">Paste code or a GitHub PR URL, pick which checks to run, and click Run Review.</p>
      </div>
    );
  }

  const issuesFound = result.issues.length;
  const hasCritical = (result.summary.critical_count || 0) > 0;

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

      <div className="flex flex-wrap gap-1 bg-bg-card border border-border-subtle rounded-lg p-1">
        {CATEGORIES.map(cat => {
          const count = cat.key === 'all' ? issuesFound : categoryCounts[cat.key] || 0;
          const active = categoryFilter === cat.key;
          const showRedBadge = cat.key === 'security' && hasCritical;
          return (
            <button
              key={cat.key}
              onClick={() => setCategoryFilter(cat.key)}
              className={`relative text-xs px-3 py-1.5 rounded transition ${
                active ? 'bg-bg-elevated text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {cat.icon} {cat.label} ({count})
              {showRedBadge && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-severity-critical rounded-full" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3">
        {filteredIssues.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-8">
            No issues in this filter. Try a different category or severity.
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

      <div className="sticky bottom-0 -mx-4 px-4 py-3 bg-bg-base/95 backdrop-blur border-t border-border-subtle flex flex-wrap gap-2 mt-auto">
        <button onClick={onApplyAllFixes} className="btn-primary text-sm flex-1 min-w-[180px]">
          🛡️ Apply All Fixes
        </button>
        <button onClick={handleDownload} className="btn-secondary text-sm">Download Report</button>
        <button onClick={handleCopySummary} className="btn-secondary text-sm">Copy Summary</button>
      </div>
    </div>
  );
}
