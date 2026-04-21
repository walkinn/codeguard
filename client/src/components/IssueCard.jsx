// A single issue with severity badge, description, impact, vulnerable snippet, and fixes — all always visible.
import FixTabs from './FixTabs.jsx';

const SEVERITY_STYLES = {
  critical: 'bg-severity-critical text-white',
  high: 'bg-severity-high text-white',
  medium: 'bg-severity-medium text-bg-base',
  low: 'bg-severity-low text-white',
  info: 'bg-severity-info text-white',
};

const CATEGORY_ICON = {
  security: '🔒',
  bug: '🐛',
  performance: '⚡',
  style: '✨',
};

export default function IssueCard({ issue, index, onLineClick, onApplyFix, onCopyFix, onToast }) {
  const sevClass = SEVERITY_STYLES[issue.severity] || SEVERITY_STYLES.info;
  const icon = CATEGORY_ICON[issue.category] || '⚠️';
  const fixes = issue.fixes || [];

  const handleApply = (fix) => {
    onApplyFix(issue, fix);
    onToast?.('Fix applied to editor');
  };
  const handleCopy = async (fix) => {
    try {
      await navigator.clipboard.writeText(fix.code);
      onToast?.('Copied to clipboard');
    } catch {
      onCopyFix?.(fix);
    }
  };

  return (
    <div
      className="issue-card-enter bg-bg-card border border-border-subtle rounded-xl p-4 flex flex-col gap-3"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${sevClass} ${issue.severity === 'critical' ? 'animate-pulse-red' : ''}`}>
            {issue.severity}
          </span>
          <span className="text-xs text-gray-400">{icon} {issue.category}</span>
        </div>
        <button
          onClick={() => onLineClick(issue.line_start, issue.line_end)}
          className="text-xs font-mono text-accent hover:underline shrink-0"
          title="Jump to line"
        >
          Line {issue.line_start}{issue.line_end && issue.line_end !== issue.line_start ? `–${issue.line_end}` : ''}
        </button>
      </div>

      <h3 className="text-base font-semibold text-white">{issue.title}</h3>

      <p className="text-sm text-gray-300 leading-relaxed">{issue.description}</p>

      {issue.impact && (
        <p className="text-sm text-red-300/90">
          <span className="font-medium">Impact:</span> {issue.impact}
        </p>
      )}

      {(issue.owasp_category || issue.cwe_id) && (
        <div className="flex flex-wrap gap-2">
          {issue.owasp_category && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-severity-critical/15 text-red-300 border border-severity-critical/30">
              {issue.owasp_category}
            </span>
          )}
          {issue.cwe_id && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-severity-high/15 text-orange-300 border border-severity-high/30">
              {issue.cwe_id}
            </span>
          )}
        </div>
      )}

      {issue.code_snippet && (
        <div className="rounded-lg bg-red-500/5 border border-red-500/30 overflow-hidden">
          <div className="px-3 py-1.5 bg-red-500/10 border-b border-red-500/20 text-xs font-medium text-red-400">
            ❌ Vulnerable Code
          </div>
          <pre className="p-3 text-xs font-mono text-gray-100 overflow-x-auto whitespace-pre-wrap">
            <code>{issue.code_snippet}</code>
          </pre>
        </div>
      )}

      <FixTabs fixes={fixes} onApply={handleApply} onCopy={handleCopy} />
    </div>
  );
}
