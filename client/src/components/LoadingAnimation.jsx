// Minimal loading state — centered thin shield outline + three opacity-pulsing dots.

export default function LoadingAnimation({ linesAnalyzed }) {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center gap-5 text-center px-6">
      <svg className="w-14 h-14 text-white/70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" aria-hidden>
        <path d="M12 2 4 5v6c0 5 3.5 9.3 8 11 4.5-1.7 8-6 8-11V5l-8-3z" />
      </svg>
      <div>
        <p className="text-base font-medium text-white">Analyzing {linesAnalyzed} lines</p>
        <p className="text-xs text-white/40 mt-1.5 max-w-sm">
          scanning for vulnerabilities, bugs, and performance issues
        </p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-white/70 animate-dot-pulse"
            style={{ animationDelay: `${i * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
}
