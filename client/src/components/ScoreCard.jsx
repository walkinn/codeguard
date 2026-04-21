// Animated circular score ring with letter grade, numeric score, and verdict.
import { useEffect, useState } from 'react';

const GRADE_COLORS = {
  A: { stroke: '#22c55e', text: 'text-green-400', bg: 'bg-green-500/10' },
  B: { stroke: '#84cc16', text: 'text-lime-400', bg: 'bg-lime-500/10' },
  C: { stroke: '#eab308', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  D: { stroke: '#f97316', text: 'text-orange-400', bg: 'bg-orange-500/10' },
  F: { stroke: '#ef4444', text: 'text-red-400', bg: 'bg-red-500/10' },
};

export default function ScoreCard({ grade, score, verdict, linesAnalyzed, issuesFound }) {
  const colors = GRADE_COLORS[grade] || GRADE_COLORS.C;
  const [progress, setProgress] = useState(0);
  const radius = 56;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const t = setTimeout(() => setProgress(score || 0), 80);
    return () => clearTimeout(t);
  }, [score]);

  const dashOffset = circumference - (progress / 100) * circumference;
  const timeSaved = Math.max(5, Math.round((linesAnalyzed || 0) / 10) + (issuesFound || 0) * 3);

  return (
    <div className="flex flex-col items-center bg-bg-card border border-border-subtle rounded-xl p-6">
      <div className="relative w-36 h-36">
        <svg width="144" height="144" className="-rotate-90">
          <circle
            cx="72" cy="72" r={radius}
            stroke="#2a323d" strokeWidth="10" fill="none"
          />
          <circle
            cx="72" cy="72" r={radius}
            stroke={colors.stroke} strokeWidth="10" fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 1.4s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-5xl font-bold ${colors.text}`}>{grade}</span>
          <span className="text-sm text-gray-400 mt-0.5">{score}/100</span>
        </div>
      </div>
      <p className="text-base text-white text-center mt-4 font-medium">{verdict}</p>
      <p className="text-xs text-gray-400 text-center mt-2">
        {linesAnalyzed} lines analyzed • {issuesFound} issue{issuesFound === 1 ? '' : 's'} found • Est. {timeSaved} min review time saved
      </p>
    </div>
  );
}
