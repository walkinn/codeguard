// Renders multiple fix alternatives as tabs with syntax-highlighted code and tradeoff notes.
import { useState } from 'react';

export default function FixTabs({ fixes, onApply, onCopy }) {
  const [active, setActive] = useState(0);
  if (!fixes || fixes.length === 0) return null;

  const safeIndex = Math.min(active, fixes.length - 1);
  const current = fixes[safeIndex];

  return (
    <div className="flex flex-col gap-2">
      {fixes.length > 1 && (
        <div className="flex gap-1 border-b border-border-subtle">
          {fixes.map((fix, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`text-xs px-3 py-1.5 transition border-b-2 ${
                i === safeIndex
                  ? 'border-accent text-white'
                  : 'border-transparent text-gray-400 hover:text-white'
              }`}
            >
              Fix {i + 1}: {fix.label || 'Alternative'}
            </button>
          ))}
        </div>
      )}
      <div className="rounded-lg bg-green-500/5 border border-green-500/30 overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 bg-green-500/10 border-b border-green-500/20">
          <span className="text-xs font-medium text-green-400">✅ {current.label || 'Secure Fix'}</span>
          <div className="flex gap-2">
            <button
              onClick={() => onApply(current)}
              className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-300 hover:bg-green-500/30 transition"
            >Apply This Fix</button>
            <button
              onClick={() => onCopy(current)}
              className="text-xs px-2 py-1 rounded bg-bg-elevated text-gray-300 hover:text-white transition"
            >Copy Fix</button>
          </div>
        </div>
        <pre className="p-3 text-xs font-mono text-gray-100 overflow-x-auto whitespace-pre-wrap">
          <code>{current.code}</code>
        </pre>
      </div>
      {current.tradeoff && (
        <p className="text-xs text-gray-400 italic px-1">
          <span className="font-medium">Tradeoff:</span> {current.tradeoff}
        </p>
      )}
    </div>
  );
}
