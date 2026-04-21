// About page — project description, author, and tech stack badges.

const TECH = [
  { label: 'React', color: 'bg-sky-500/15 text-sky-300 border-sky-500/30' },
  { label: 'Node.js', color: 'bg-green-500/15 text-green-300 border-green-500/30' },
  { label: 'OpenAI GPT-4o', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  { label: 'Tailwind CSS', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
  { label: 'Monaco Editor', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  { label: 'Express', color: 'bg-gray-500/15 text-gray-300 border-gray-500/30' },
];

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-3xl font-bold gradient-text mb-2">About CodeGuard AI</h1>
      <p className="text-gray-400 mb-8">Your AI wrote the code — now let AI audit it.</p>

      <section className="bg-bg-card border border-border-subtle rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Why this exists</h2>
        <p className="text-sm text-gray-300 leading-relaxed">
          Vibe coding — prompting an LLM and shipping the output — gets you to a working app fast,
          but it also ships with surprising security holes: hardcoded keys, SQL injection, eval-based
          input handling, debug mode in production. Traditional linters miss most of this. CodeGuard
          uses a security-focused prompt on top of GPT-4o to catch what human review and static analysis
          commonly let slip through.
        </p>
      </section>

      <section className="bg-bg-card border border-border-subtle rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">What it checks</h2>
        <ul className="text-sm text-gray-300 space-y-1.5 list-disc list-inside">
          <li>🔒 OWASP Top 10 — injection, broken auth, XSS, CSRF, insecure deserialization</li>
          <li>🐛 Bugs — null refs, race conditions, unclosed resources, dead code</li>
          <li>⚡ Performance — N+1 queries, sync-in-async, missing pagination, memory leaks</li>
          <li>✨ Style — long functions, magic numbers, missing error handling, leftover debug code</li>
        </ul>
      </section>

      <section className="bg-bg-card border border-border-subtle rounded-xl p-6 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Tech stack</h2>
        <div className="flex flex-wrap gap-2">
          {TECH.map(t => (
            <span key={t.label} className={`text-xs px-2.5 py-1 rounded-full border ${t.color}`}>
              {t.label}
            </span>
          ))}
        </div>
      </section>

      <section className="bg-bg-card border border-border-subtle rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-3">Built by Danis Gabitov</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="https://github.com/walkinn"
            target="_blank" rel="noopener noreferrer"
            className="btn-secondary text-sm"
          >GitHub → @walkinn</a>
          <a
            href="https://linkedin.com/in/danis-gabitov"
            target="_blank" rel="noopener noreferrer"
            className="btn-secondary text-sm"
          >LinkedIn → danis-gabitov</a>
        </div>
      </section>
    </div>
  );
}
