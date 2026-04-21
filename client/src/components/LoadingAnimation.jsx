// Scanning-shield animation shown while the backend analyzes the code.

export default function LoadingAnimation({ linesAnalyzed }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 text-accent animate-pulse" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" opacity="0.3" />
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
        </svg>
        <div className="absolute inset-0 overflow-hidden rounded-full">
          <div className="absolute left-0 right-0 h-0.5 bg-accent shadow-[0_0_8px_2px_rgba(94,234,212,0.6)] animate-scan" />
        </div>
      </div>
      <div className="text-center">
        <p className="text-lg font-medium text-white">Analyzing {linesAnalyzed} lines…</p>
        <p className="text-sm text-gray-400 mt-1">CodeGuard is scanning for vulnerabilities, bugs, and performance issues</p>
      </div>
      <div className="flex gap-2 mt-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-accent animate-pulse"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
