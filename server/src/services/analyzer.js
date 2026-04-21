// Calls OpenAI GPT-4o with the security-review system prompt and validates the JSON response.
import OpenAI from 'openai';
import { buildSystemPrompt } from '../prompts/security-review.js';
import { addLineNumbers, countLines } from '../utils/lineNumberer.js';

const MODEL = 'gpt-4o';

function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === 'your-key-here') {
    throw new Error('OPENAI_API_KEY is not configured. Copy .env.example to .env and add your key.');
  }
  return new OpenAI({ apiKey: key });
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

export async function analyzeCode({ code, language, categories }) {
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

  const callOpenAI = async (extraInstruction = '') => {
    return client.chat.completions.create({
      model: MODEL,
      response_format: { type: 'json_object' },
      temperature: 0.1,
      messages: [
        { role: 'system', content: systemPrompt + (extraInstruction ? `\n\n${extraInstruction}` : '') },
        { role: 'user', content: userPrompt },
      ],
    });
  };

  let response;
  try {
    response = await callOpenAI();
  } catch (err) {
    if (err.status === 429) throw new Error('OpenAI rate limit hit — try again in a moment.');
    if (err.status === 401) throw new Error('OpenAI API key is invalid.');
    throw new Error(`OpenAI API error: ${err.message || 'unknown'}`);
  }

  const text = response.choices?.[0]?.message?.content || '';
  let parsed = tryParseJson(text);

  if (!validateShape(parsed)) {
    const retry = await callOpenAI('IMPORTANT: Your previous response was not valid JSON. Respond ONLY with a valid JSON object matching the schema. No markdown, no prose.');
    parsed = tryParseJson(retry.choices?.[0]?.message?.content || '');
    if (!validateShape(parsed)) {
      throw new Error('Model returned invalid JSON after retry.');
    }
  }

  return normalizeResult(parsed, language, lines);
}
