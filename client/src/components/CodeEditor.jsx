// Monaco editor wrapped in a macOS terminal-style glass card with pure black canvas.
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
          linesDecorationsClassName: 'border-l-2 border-cat-security',
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
    <div className="flex flex-col h-full glass overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/6">
        <div className="flex items-center gap-3">
          <span className="term-dots" aria-hidden>
            <span className="d-r" />
            <span className="d-y" />
            <span className="d-g" />
          </span>
          <span className="text-[11px] font-mono text-white/45">
            {detected === 'auto' ? 'detecting…' : detected}
          </span>
        </div>
        <select
          value={language || 'auto'}
          onChange={(e) => onLanguageChange?.(e.target.value)}
          className="glass-select"
          aria-label="Override language"
        >
          {LANGUAGE_OPTIONS.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-h-0 bg-black">
        <Editor
          height="100%"
          defaultLanguage="python"
          language={effectiveLanguage === 'auto' ? 'plaintext' : effectiveLanguage}
          value={value}
          onChange={(v) => onChange(v || '')}
          theme="codeguard-dark"
          beforeMount={(monaco) => {
            monaco.editor.defineTheme('codeguard-dark', {
              base: 'vs-dark',
              inherit: true,
              rules: [],
              colors: {
                'editor.background': '#000000',
                'editor.foreground': '#ffffff',
                'editorLineNumber.foreground': '#444444',
                'editorLineNumber.activeForeground': '#888888',
                'editor.lineHighlightBackground': '#0a0a0a',
                'editor.selectionBackground': '#ffffff20',
                'editorCursor.foreground': '#ffffff',
                'editorGutter.background': '#000000',
              },
            });
          }}
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
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
          }}
        />
      </div>
    </div>
  );
});

export default CodeEditor;
