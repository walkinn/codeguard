// Minimal circular score — thin 2px ring, clean grade letter, muted details.
import { useEffect, useState } from 'react';

const GRADE_COLORS = {
  A: '#22c55e',
  B: '#84cc16',
  C: '#eab308',
  D: '#f97316',
  F: '#ef4444',
};

export default function ScoreCard({ grade, score, verdict, linesAnalyzed, issuesFound }) {
  const stroke = GRADE_COLORS[grade] || GRADE_COLORS.C;
  const [progress, setProgress] = useState(0);
  const radius = 62;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const t = setTimeout(() => setProgress(score || 0), 60);
    return () => clearTimeout(t);
  }, [score]);

  const dashOffset = circumference - (progress / 100) * circumference;
  const timeSaved = Math.max(5, Math.round((linesAnalyzed || 0) / 10) + (issuesFound || 0) * 3);

  return (
    <div className="glass p-6 flex flex-col items-center animate-fade-in-up">
      <div className="relative w-36 h-36">
        <svg width="144" height="144" className="-rotate-90" aria-hidden>
          <circle
            cx="72" cy="72" r={radius}
            stroke="rgba(255,255,255,0.06)" strokeWidth="2" fill="none"
          />
          <circle
            cx="72" cy="72" r={radius}
            stroke={stroke} strokeWidth="2" fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1.2s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-5xl font-semibold text-white leading-none" style={{ color: stroke }}>
            {grade}
          </span>
          <span className="text-xs text-white/40 mt-2 font-mono">{score}/100</span>
        </div>
      </div>
      <p className="text-sm text-white text-center mt-5 leading-relaxed max-w-md">
        {verdict}
      </p>
      <div className="flex items-center gap-3 text-[11px] text-white/40 mt-3 flex-wrap justify-center font-mono">
        <span>{linesAnalyzed} lines</span>
        <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
        <span>{issuesFound} issue{issuesFound === 1 ? '' : 's'}</span>
        <span className="w-0.5 h-0.5 rounded-full bg-white/20" />
        <span>~{timeSaved} min saved</span>
      </div>
    </div>
  );
}
