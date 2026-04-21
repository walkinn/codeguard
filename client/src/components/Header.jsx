// Top navigation header with branding and page links.

export default function Header({ currentPage, onNavigate }) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border-subtle bg-bg-card">
      <div className="flex items-center gap-3">
        <svg className="w-7 h-7 text-accent" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" opacity="0.2" />
          <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
        </svg>
        <div>
          <h1 className="text-lg font-bold tracking-tight gradient-text leading-none">CodeGuard AI</h1>
          <p className="text-[11px] text-gray-400 leading-none mt-0.5">AI-powered code review & security audit</p>
        </div>
      </div>
      <nav className="flex items-center gap-1 text-sm">
        <button
          onClick={() => onNavigate('review')}
          className={`px-3 py-1.5 rounded-md transition ${currentPage === 'review' ? 'bg-bg-elevated text-white' : 'text-gray-400 hover:text-white'}`}
        >Review</button>
        <button
          onClick={() => onNavigate('about')}
          className={`px-3 py-1.5 rounded-md transition ${currentPage === 'about' ? 'bg-bg-elevated text-white' : 'text-gray-400 hover:text-white'}`}
        >About</button>
      </nav>
    </header>
  );
}
