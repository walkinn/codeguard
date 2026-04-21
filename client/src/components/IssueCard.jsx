// Issue card — thin category-colored left border, dotted severity badge, compact pill tags.
import FixTabs from './FixTabs.jsx';

const SEVERITY_META = {
  critical: { label: 'CRITICAL', color: '#ff3b3b' },
  high:     { label: 'HIGH',     color: '#f97316' },
  medium:   { label: 'MEDIUM',   color: '#eab308' },
  low:      { label: 'LOW',      color: '#3b82f6' },
  info:     { label: 'INFO',     color: '#94a3b8' },
};

const CATEGORY_COLOR = {
  security:    '#ff3b3b',
  bug:         '#ffcc00',
  performance: '#3b82f6',
  style:       '#a855f7',
};

export default function IssueCard({ issue, index, onLineClick, onApplyFix, onCopyFix, onToast }) {
  const sev = SEVERITY_META[issue.severity] || SEVERITY_META.info;
  const catColor = CATEGORY_COLOR[issue.category] || 'rgba(255,255,255,0.2)';
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
      className="issue-card-enter glass relative overflow-hidden p-5 flex flex-col gap-3"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Thin category accent bar on the left */}
      <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: catColor }} />

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded-full border inline-flex items-center gap-1.5 text-white/85"
            style={{ borderColor: `${sev.color}55`, background: `${sev.color}10` }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: sev.color }} />
            {sev.label}
          </span>
          <span className="text-[10px] text-white/40 font-mono uppercase tracking-wider inline-flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full" style={{ background: catColor }} />
            {issue.category}
          </span>
        </div>
        <button
          onClick={() => onLineClick(issue.line_start, issue.line_end)}
          className="text-[11px] font-mono text-white/60 hover:text-white transition shrink-0 px-2 py-0.5 rounded border border-white/10 hover:border-white/25"
          title="Jump to line"
        >
          L{issue.line_start}{issue.line_end && issue.line_end !== issue.line_start ? `–${issue.line_end}` : ''}
        </button>
      </div>

      <h3 className="text-base font-semibold text-white leading-snug">{issue.title}</h3>

      <p className="text-sm text-white/65 leading-relaxed">{issue.description}</p>

      {issue.impact && (
        <div className="rounded-lg border-l-2 border-cat-security/60 bg-[rgba(255,59,59,0.04)] pl-3 py-1.5">
          <p className="text-xs text-white/75 leading-relaxed">
            <span className="font-medium text-white/90">Impact · </span>
            {issue.impact}
          </p>
        </div>
      )}

      {(issue.owasp_category || issue.cwe_id) && (
        <div className="flex flex-wrap gap-1.5">
          {issue.owasp_category && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/6 text-white/70 border border-white/10">
              {issue.owasp_category}
            </span>
          )}
          {issue.cwe_id && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/6 text-white/70 border border-white/10">
              {issue.cwe_id}
            </span>
          )}
        </div>
      )}

      {issue.code_snippet && (
        <div className="rounded-lg overflow-hidden border-l-2 border-cat-security/60 bg-[rgba(255,59,59,0.04)]">
          <div className="px-3 py-1.5 border-b border-white/5 text-[11px] font-medium text-white/70 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cat-security" />
            Vulnerable Code
          </div>
          <pre className="p-3 text-xs font-mono text-white/90 overflow-x-auto whitespace-pre-wrap">
            <code>{issue.code_snippet}</code>
          </pre>
        </div>
      )}

      <FixTabs fixes={fixes} onApply={handleApply} onCopy={handleCopy} />
    </div>
  );
}
