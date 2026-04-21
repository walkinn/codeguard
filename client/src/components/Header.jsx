// Top header — minimal shield outline, lowercase codeguard wordmark, glass nav pills.

export default function Header({ currentPage, onNavigate }) {
  return (
    <header className="sticky top-0 z-40 px-6 py-3 border-b border-white/6 bg-black/50 backdrop-blur-xl">
      <div className="flex items-center justify-between max-w-[1600px] mx-auto">
        <button
          onClick={() => onNavigate('review')}
          className="flex items-center gap-2.5 group"
        >
          <svg className="w-5 h-5 text-white/90 group-hover:text-white transition" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden>
            <path d="M12 2 4 5v6c0 5 3.5 9.3 8 11 4.5-1.7 8-6 8-11V5l-8-3z" />
          </svg>
          <div className="text-left leading-none">
            <h1 className="text-[15px] font-semibold tracking-tight text-white">codeguard</h1>
            <p className="text-[10px] text-white/40 mt-0.5">code review & security audit</p>
          </div>
        </button>

        <nav className="flex items-center gap-0.5 glass-pill p-0.5 text-sm">
          {[
            { key: 'review', label: 'Review' },
            { key: 'about', label: 'About' },
          ].map(item => (
            <button
              key={item.key}
              onClick={() => onNavigate(item.key)}
              className={`px-3.5 py-1 rounded-full text-xs font-medium transition ${
                currentPage === item.key
                  ? 'bg-white/10 text-white'
                  : 'text-white/50 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
