// Monaco editor with syntax highlighting, language detection, and imperative handle for highlighting/replacing ranges.
import { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';

const LANGUAGE_HINTS = [
  { match: /^\s*(import |from .+ import |def |class .+:|print\()/m, lang: 'python' },
  { match: /^\s*(const |let |var |function |import .+ from |export )/m, lang: 'javascript' },
  { match: /<\w+[^>]*>/m, lang: 'html' },
  { match: /^\s*(public |private |class .+\{|package )/m, lang: 'java' },
  { match: /^\s*(package |func |import \()/m, lang: 'go' },
  { match: /^\s*(fn |let mut|use std::)/m, lang: 'rust' },
  { match: /^\s*(SELECT |INSERT |UPDATE |DELETE )/im, lang: 'sql' },
];

const LANGUAGE_OPTIONS = [
  'auto', 'python', 'javascript', 'typescript', 'java', 'go', 'rust',
  'cpp', 'csharp', 'php', 'ruby', 'html', 'css', 'sql', 'shell', 'json',
];

export function detectLanguage(code) {
  if (!code || !code.trim()) return 'auto';
  for (const { match, lang } of LANGUAGE_HINTS) {
    if (match.test(code)) return lang;
  }
  return 'plaintext';
}

const CodeEditor = forwardRef(function CodeEditor(
  { value, onChange, language, onLanguageChange },
  ref
) {
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);
  const [detected, setDetected] = useState('auto');

  useEffect(() => {
    const next = detectLanguage(value);
    setDetected(next);
  }, [value]);

  useImperativeHandle(ref, () => ({
    highlightLines(startLine, endLine) {
      if (!editorRef.current || !monacoRef.current) return;
      const monaco = monacoRef.current;
      const editor = editorRef.current;
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [{
        range: new monaco.Range(startLine, 1, endLine, 1),
        options: {
          isWholeLine: true,
          className: 'bg-red-500/10',
          linesDecorationsClassName: 'border-l-4 border-severity-critical',
        },
      }]);
      editor.revealLineInCenter(startLine);
    },
    replaceRange(startLine, endLine, newText) {
      if (!editorRef.current || !monacoRef.current) return;
      const monaco = monacoRef.current;
      const editor = editorRef.current;
      const model = editor.getModel();
      if (!model) return;
      const endColumn = model.getLineMaxColumn(Math.min(endLine, model.getLineCount()));
      editor.executeEdits('apply-fix', [{
        range: new monaco.Range(startLine, 1, endLine, endColumn),
        text: newText,
        forceMoveMarkers: true,
      }]);
    },
    setValue(text) {
      if (editorRef.current) editorRef.current.setValue(text);
    },
    getValue() {
      return editorRef.current ? editorRef.current.getValue() : value;
    },
  }), [value]);

  const effectiveLanguage = !language || language === 'auto' ? detected : language;

  return (
    <div className="flex flex-col h-full bg-bg-card rounded-lg border border-border-subtle overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-bg-elevated">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-gray-400">Language:</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-accent/10 text-accent">
            {detected === 'auto' ? 'detecting…' : detected}
          </span>
        </div>
        <select
          value={language || 'auto'}
          onChange={(e) => onLanguageChange?.(e.target.value)}
          className="text-xs bg-bg-card border border-border-subtle rounded px-2 py-1 text-white"
          aria-label="Override language"
        >
          {LANGUAGE_OPTIONS.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-h-0">
        <Editor
          height="100%"
          defaultLanguage="python"
          language={effectiveLanguage === 'auto' ? 'plaintext' : effectiveLanguage}
          value={value}
          onChange={(v) => onChange(v || '')}
          theme="vs-dark"
          onMount={(editor, monaco) => {
            editorRef.current = editor;
            monacoRef.current = monaco;
          }}
          options={{
            fontSize: 13,
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            renderLineHighlight: 'line',
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    </div>
  );
});

export default CodeEditor;
