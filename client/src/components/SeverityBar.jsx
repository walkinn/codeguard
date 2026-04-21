// Severity breakdown — thin horizontal line segments + clean filter pills with dots.

const LEVELS = [
  { key: 'critical', label: 'CRITICAL', color: '#ff3b3b' },
  { key: 'high',     label: 'HIGH',     color: '#f97316' },
  { key: 'medium',   label: 'MEDIUM',   color: '#eab308' },
  { key: 'low',      label: 'LOW',      color: '#3b82f6' },
];

export default function SeverityBar({ summary, activeFilter, onFilterChange }) {
  const counts = {
    critical: summary.critical_count || 0,
    high: summary.high_count || 0,
    medium: summary.medium_count || 0,
    low: summary.low_count || 0,
  };
  const total = counts.critical + counts.high + counts.medium + counts.low || 1;

  return (
    <div className="glass p-4 animate-fade-in-up" style={{ animationDelay: '60ms' }}>
      <div className="flex h-0.5 rounded-full overflow-hidden mb-3 bg-white/5">
        {LEVELS.map(({ key, color }) => {
          const width = (counts[key] / total) * 100;
          if (width === 0) return null;
          return (
            <div
              key={key}
              style={{ width: `${width}%`, background: color }}
              title={`${key}: ${counts[key]}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onFilterChange(null)}
          className={`text-[11px] px-2.5 py-1 rounded-full transition border ${
            !activeFilter
              ? 'bg-white/8 text-white border-white/20'
              : 'text-white/45 border-transparent hover:text-white hover:bg-white/4'
          }`}
        >All</button>
        {LEVELS.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => onFilterChange(activeFilter === key ? null : key)}
            className={`text-[11px] px-2.5 py-1 rounded-full transition border inline-flex items-center gap-1.5 font-mono tracking-wide ${
              activeFilter === key
                ? 'bg-white/8 text-white border-white/20'
                : 'text-white/45 border-transparent hover:text-white hover:bg-white/4'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            {label} {counts[key]}
          </button>
        ))}
      </div>
    </div>
  );
}
