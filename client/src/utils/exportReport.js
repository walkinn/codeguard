// Builds a markdown audit report and triggers a browser download.

const SEVERITY_EMOJI = {
  critical: '🔴',
  high: '🟠',
  medium: '🟡',
  low: '🔵',
  info: '⚪',
};

function formatFenceLang(language) {
  if (!language || language === 'auto' || language === 'plaintext') return '';
  return language;
}

export function buildMarkdownReport(result) {
  const date = new Date().toISOString().slice(0, 10);
  const s = result.summary || {};
  const lang = formatFenceLang(result.language);

  const lines = [
    '# CodeGuard AI — Security Audit Report',
    '',
    `**Date:** ${date}`,
    `**Language:** ${result.language || 'unknown'}`,
    `**Grade:** ${result.overall_grade} (${result.overall_score}/100)`,
    `**Verdict:** ${result.verdict || '-'}`,
    '',
    '## Summary',
    '',
    `- Critical: ${s.critical_count || 0} | High: ${s.high_count || 0} | Medium: ${s.medium_count || 0} | Low: ${s.low_count || 0} | Info: ${s.info_count || 0}`,
    `- Security: ${s.security_issues || 0} | Bugs: ${s.bug_issues || 0} | Performance: ${s.performance_issues || 0} | Style: ${s.style_issues || 0}`,
    `- Lines analyzed: ${result.lines_analyzed || 0}`,
    '',
    '## Issues',
    '',
  ];

  if (!result.issues || result.issues.length === 0) {
    lines.push('_No issues found._');
    return lines.join('\n');
  }

  result.issues.forEach(issue => {
    const emoji = SEVERITY_EMOJI[issue.severity] || '⚪';
    const lineRange = issue.line_end && issue.line_end !== issue.line_start
      ? `Lines ${issue.line_start}-${issue.line_end}`
      : `Line ${issue.line_start}`;
    lines.push(`### ${emoji} ${issue.severity?.toUpperCase()} — ${issue.title} (${lineRange})`);
    lines.push('');
    if (issue.description) {
      lines.push(`**Description:** ${issue.description}`);
      lines.push('');
    }
    if (issue.impact) {
      lines.push(`**Impact:** ${issue.impact}`);
      lines.push('');
    }
    if (issue.owasp_category) {
      lines.push(`**OWASP:** ${issue.owasp_category}`);
    }
    if (issue.cwe_id) {
      lines.push(`**CWE:** ${issue.cwe_id}`);
    }
    if (issue.owasp_category || issue.cwe_id) lines.push('');

    if (issue.code_snippet) {
      lines.push('**Vulnerable code:**');
      lines.push('```' + lang);
      lines.push(issue.code_snippet);
      lines.push('```');
      lines.push('');
    }

    if (issue.fixes && issue.fixes.length > 0) {
      issue.fixes.forEach((fix, i) => {
        lines.push(`**Fix ${i + 1} — ${fix.label || 'Suggested'}:**`);
        lines.push('```' + lang);
        lines.push(fix.code);
        lines.push('```');
        if (fix.tradeoff) {
          lines.push(`_Tradeoff: ${fix.tradeoff}_`);
        }
        lines.push('');
      });
    }

    lines.push('---');
    lines.push('');
  });

  return lines.join('\n');
}

export function buildTextSummary(result) {
  const s = result.summary || {};
  return [
    `CodeGuard AI — Grade ${result.overall_grade} (${result.overall_score}/100)`,
    result.verdict || '',
    `Issues — Critical: ${s.critical_count || 0}, High: ${s.high_count || 0}, Medium: ${s.medium_count || 0}, Low: ${s.low_count || 0}`,
    `Security: ${s.security_issues || 0} | Bugs: ${s.bug_issues || 0} | Perf: ${s.performance_issues || 0} | Style: ${s.style_issues || 0}`,
  ].filter(Boolean).join('\n');
}

export function downloadMarkdown(markdown, filename = 'codeguard-report.md') {
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
