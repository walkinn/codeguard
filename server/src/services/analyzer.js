// Calls Anthropic Claude with the security-review system prompt and validates the JSON response.
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '../prompts/security-review.js';
import { addLineNumbers, countLines } from '../utils/lineNumberer.js';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 8192;
const MAX_ISSUES = 12;
const MAX_FIXES_PER_ISSUE = 2;

const REVIEW_TOOL = {
  name: 'return_review',
  description: 'Return the full structured code review. Be concise: cap at the 12 most impactful issues, prefer 1 fix per issue (2 only for critical).',
  input_schema: {
    type: 'object',
    properties: {
      language: { type: 'string', maxLength: 40 },
      lines_analyzed: { type: 'integer' },
      overall_grade: { type: 'string', enum: ['A', 'B', 'C', 'D', 'F'] },
      overall_score: { type: 'integer' },
      verdict: { type: 'string', maxLength: 200 },
      issues: {
        type: 'array',
        maxItems: MAX_ISSUES,
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', maxLength: 40 },
            category: { type: 'string', enum: ['security', 'bug', 'bugs', 'performance', 'style'] },
            severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'info'] },
            title: { type: 'string', maxLength: 120 },
            description: { type: 'string', maxLength: 400 },
            impact: { type: 'string', maxLength: 200 },
            line_start: { type: 'integer' },
            line_end: { type: 'integer' },
            code_snippet: { type: 'string', maxLength: 300 },
            fixes: {
              type: 'array',
              maxItems: MAX_FIXES_PER_ISSUE,
              items: {
                type: 'object',
                properties: {
                  label: { type: 'string', maxLength: 60 },
                  code: { type: 'string' },
                  tradeoff: { type: 'string', maxLength: 200 },
                },
                required: ['label', 'code'],
              },
            },
            owasp_category: { type: ['string', 'null'], maxLength: 80 },
            cwe_id: { type: ['string', 'null'], maxLength: 20 },
          },
          required: ['title', 'description', 'severity', 'category', 'line_start', 'fixes'],
        },
      },
      summary: {
        type: 'object',
        properties: {
          critical_count: { type: 'integer' },
          high_count: { type: 'integer' },
          medium_count: { type: 'integer' },
          low_count: { type: 'integer' },
          info_count: { type: 'integer' },
          security_issues: { type: 'integer' },
          bug_issues: { type: 'integer' },
          performance_issues: { type: 'integer' },
          style_issues: { type: 'integer' },
        },
      },
    },
    required: ['overall_grade', 'overall_score', 'verdict', 'issues', 'summary'],
  },
};

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === 'your-key-here') {
    throw new Error('ANTHROPIC_API_KEY is not configured. Copy .env.example to .env and add your key.');
  }
  return new Anthropic({ apiKey: key });
}

function tryParseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      try { return JSON.parse(match[0]); } catch { /* fallthrough */ }
    }
    return null;
  }
}

function validateShape(obj) {
  if (!obj || typeof obj !== 'object') return false;
  if (!Array.isArray(obj.issues)) return false;
  if (!obj.summary || typeof obj.summary !== 'object') return false;
  return true;
}

function normalizeResult(result, fallbackLanguage, fallbackLines) {
  result.language = result.language || fallbackLanguage || 'unknown';
  result.lines_analyzed = result.lines_analyzed || fallbackLines;
  result.issues = (result.issues || []).map((issue, i) => ({
    id: issue.id || `issue-${i + 1}`,
    category: issue.category || 'security',
    severity: issue.severity || 'medium',
    title: issue.title || 'Untitled issue',
    description: issue.description || '',
    impact: issue.impact || '',
    line_start: issue.line_start || 1,
    line_end: issue.line_end || issue.line_start || 1,
    code_snippet: issue.code_snippet || '',
    fixes: Array.isArray(issue.fixes) && issue.fixes.length > 0
      ? issue.fixes
      : [{ label: 'Suggested fix', code: '// No fix provided', tradeoff: '' }],
    owasp_category: issue.owasp_category || null,
    cwe_id: issue.cwe_id || null,
  }));
  const s = result.summary;
  ['critical_count', 'high_count', 'medium_count', 'low_count', 'info_count',
   'security_issues', 'bug_issues', 'performance_issues', 'style_issues'].forEach(k => {
    if (typeof s[k] !== 'number') s[k] = 0;
  });
  return result;
}

export async function analyzeCode({ code, language, categories, onDelta }) {
  if (!code || !code.trim()) {
    throw new Error('Code is empty.');
  }
  const client = getClient();
  const lines = countLines(code);
  const numbered = addLineNumbers(code);
  const systemPrompt = buildSystemPrompt(categories);
  const userPrompt = `Language (hint): ${language || 'auto-detect'}
Total lines: ${lines}

Code to review (with line numbers):

${numbered}`;

  let parsed = null;
  let stopReason = null;
  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      tools: [REVIEW_TOOL],
      tool_choice: { type: 'tool', name: REVIEW_TOOL.name },
      messages: [{ role: 'user', content: userPrompt }],
    });

    if (typeof onDelta === 'function') {
      stream.on('inputJson', (partialJson) => {
        try { onDelta(partialJson); } catch { /* swallow: never let UI callback kill the stream */ }
      });
    }

    const finalMessage = await stream.finalMessage();
    stopReason = finalMessage?.stop_reason || null;
    const toolUseBlock = finalMessage?.content?.find(b => b.type === 'tool_use');
    parsed = toolUseBlock?.input || null;
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError || err?.status === 429) {
      throw new Error('Anthropic rate limit hit — try again in a moment.');
    }
    if (err instanceof Anthropic.AuthenticationError || err?.status === 401) {
      throw new Error('Anthropic API key is invalid.');
    }
    throw new Error(`Anthropic API error: ${err.message || 'unknown'}`);
  }

  if (stopReason === 'max_tokens') {
    console.error('[analyzer] max_tokens hit; result truncated');
    throw new Error('Response was truncated — try reviewing a smaller snippet or fewer categories.');
  }

  if (!validateShape(parsed)) {
    console.error('[analyzer] invalid shape from tool_use. stop_reason=', stopReason, 'parsed=', JSON.stringify(parsed)?.slice(0, 500));
    throw new Error('Model returned an incomplete review.');
  }

  return normalizeResult(parsed, language, lines);
}
