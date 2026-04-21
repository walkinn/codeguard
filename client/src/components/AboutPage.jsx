// About page — minimal centered content, no emojis, monochrome with category-color dots only.

const TECH = ['React 18', 'Vite', 'Tailwind CSS', 'Monaco Editor', 'Node.js', 'Express', 'Anthropic Claude'];

const FEATURES = [
  {
    color: '#ff3b3b',
    title: 'Security Audit',
    body: 'OWASP Top 10 + vibe-code antipatterns: SQL injection, hardcoded secrets, XSS, CSRF, insecure deserialization, broken auth — each tagged with CWE and OWASP categories.',
  },
  {
    color: '#ffcc00',
    title: 'Bug Detection',
    body: 'Null references, race conditions, unclosed resources, dead code, type mismatches, and infinite-loop risks that static linters routinely miss.',
  },
  {
    color: '#3b82f6',
    title: 'Performance',
    body: 'N+1 queries, sync-in-async blocking, missing pagination, memory leaks from un-removed listeners, catastrophic-backtracking regex.',
  },
  {
    color: '#a855f7',
    title: 'Style & Smells',
    body: 'Long functions, deep nesting, magic numbers, inconsistent naming, leftover debug code, missing error handling on failable ops.',
  },
];

export default function AboutPage() {
  return (
    <div className="bg-black">
      <section className="px-6 pt-20 pb-14">
        <div className="max-w-3xl mx-auto text-center animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight leading-[1.1] text-white">
            your AI wrote the code —<br />
            now let AI audit it.
          </h1>
          <p className="text-sm text-white/50 mt-5 max-w-xl mx-auto leading-relaxed">
            A security-focused second opinion on code your LLM produced. Vibe coding is fast — codeguard keeps it safe.
          </p>
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="max-w-3xl mx-auto glass p-6 animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <h2 className="text-sm font-medium text-white mb-3">Why this exists</h2>
          <p className="text-sm text-white/60 leading-relaxed">
            Vibe coding — prompting an LLM and shipping the output — gets you to a working app fast, but it also ships with surprising security holes: hardcoded keys, SQL injection, eval-based input handling, debug mode in production. Traditional linters miss most of this. codeguard uses a security-focused prompt on top of Anthropic Claude to catch what human review and static analysis commonly let slip through.
          </p>
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-3">
          {FEATURES.map((f, i) => (
            <div
              key={f.title}
              className="glass relative p-5 animate-fade-in-up"
              style={{ animationDelay: `${120 + i * 60}ms` }}
            >
              <div className="absolute left-0 top-0 bottom-0 w-px" style={{ background: f.color }} />
              <div className="flex items-center gap-2 mb-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: f.color }} />
                <h3 className="text-sm font-medium text-white">{f.title}</h3>
              </div>
              <p className="text-xs text-white/55 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-6 pb-10">
        <div className="max-w-3xl mx-auto">
          <p className="text-[10px] uppercase tracking-wider text-white/35 mb-2">Tech stack</p>
          <p className="text-xs font-mono text-white/60 leading-relaxed">
            {TECH.join('  ·  ')}
          </p>
        </div>
      </section>

      <section className="px-6 pb-24">
        <div className="max-w-3xl mx-auto glass p-6 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <p className="text-[10px] uppercase tracking-wider text-white/35 mb-1">Built by</p>
          <h2 className="text-xl font-semibold text-white mb-3">Danis Gabitov</h2>
          <div className="flex gap-4 text-xs">
            <a
              href="https://github.com/walkinn"
              target="_blank" rel="noopener noreferrer"
              className="text-white/70 hover:text-white transition underline-offset-4 hover:underline"
            >
              github.com/walkinn
            </a>
            <a
              href="https://linkedin.com/in/danis-gabitov"
              target="_blank" rel="noopener noreferrer"
              className="text-white/70 hover:text-white transition underline-offset-4 hover:underline"
            >
              linkedin.com/in/danis-gabitov
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
