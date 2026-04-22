// Calls Anthropic Claude with the security-review system prompt and validates the JSON response.
import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from '../prompts/security-review.js';
import { addLineNumbers, countLines } from '../utils/lineNumberer.js';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4096;

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

  const JSON_PREFILL = '{';
  let fullText = '';
  let stopReason = null;
  try {
    const stream = client.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userPrompt },
        { role: 'assistant', content: JSON_PREFILL },
      ],
    });

    if (typeof onDelta === 'function') {
      stream.on('text', (chunk) => {
        try { onDelta(chunk); } catch { /* swallow: never let UI callback kill the stream */ }
      });
    }

    const finalMessage = await stream.finalMessage();
    const textBlock = finalMessage?.content?.find(b => b.type === 'text');
    fullText = JSON_PREFILL + (textBlock?.text || '');
    stopReason = finalMessage?.stop_reason || null;
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
    console.error('[analyzer] max_tokens hit; response length=', fullText.length);
    throw new Error('Response was truncated — try reviewing a smaller snippet or fewer categories.');
  }

  const parsed = tryParseJson(fullText);
  if (!validateShape(parsed)) {
    console.error('[analyzer] invalid JSON from model. stop_reason=', stopReason, 'length=', fullText.length, 'head=', fullText.slice(0, 500));
    throw new Error('Model returned invalid JSON.');
  }

  return normalizeResult(parsed, language, lines);
}
