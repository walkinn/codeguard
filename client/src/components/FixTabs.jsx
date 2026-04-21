// Fix alternatives — green-dot header, subtle green-tinted code block, ghost action buttons.
import { useState } from 'react';

export default function FixTabs({ fixes, onApply, onCopy }) {
  const [active, setActive] = useState(0);
  if (!fixes || fixes.length === 0) return null;

  const safeIndex = Math.min(active, fixes.length - 1);
  const current = fixes[safeIndex];

  return (
    <div className="flex flex-col gap-2">
      {fixes.length > 1 && (
        <div className="flex gap-1 flex-wrap">
          {fixes.map((fix, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`text-[11px] px-2.5 py-0.5 rounded-full transition border ${
                i === safeIndex
                  ? 'bg-white/8 text-white border-white/20'
                  : 'text-white/45 border-transparent hover:text-white hover:bg-white/4'
              }`}
            >
              Fix {i + 1}: {fix.label || 'Alternative'}
            </button>
          ))}
        </div>
      )}
      <div className="rounded-lg overflow-hidden border-l-2 border-emerald-500/60 bg-[rgba(34,197,94,0.04)]">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-white/5 gap-2 flex-wrap">
          <span className="text-[11px] font-medium text-white/75 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {current.label || 'Secure Fix'}
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => onApply(current)}
              className="text-[11px] px-2.5 py-0.5 rounded border border-white/15 text-white/85 hover:bg-white/8 hover:text-white transition"
            >
              Apply Fix
            </button>
            <button
              onClick={() => onCopy(current)}
              className="text-[11px] px-2.5 py-0.5 rounded border border-white/10 text-white/60 hover:bg-white/5 hover:text-white transition"
            >
              Copy
            </button>
          </div>
        </div>
        <pre className="p-3 text-xs font-mono text-white/90 overflow-x-auto whitespace-pre-wrap">
          <code>{current.code}</code>
        </pre>
      </div>
      {current.tradeoff && (
        <p className="text-xs text-white/45 leading-relaxed">
          <span className="text-white/65">Tradeoff · </span>
          {current.tradeoff}
        </p>
      )}
    </div>
  );
}
