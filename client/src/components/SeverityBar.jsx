// Horizontal severity breakdown; clicking a segment filters the issue list.

const LEVELS = [
  { key: 'critical', label: 'Critical', color: 'bg-severity-critical', dot: '🔴' },
  { key: 'high', label: 'High', color: 'bg-severity-high', dot: '🟠' },
  { key: 'medium', label: 'Medium', color: 'bg-severity-medium', dot: '🟡' },
  { key: 'low', label: 'Low', color: 'bg-severity-low', dot: '🔵' },
];

export default function SeverityBar({ summary, activeFilter, onFilterChange }) {
  const counts = {
    critical: summary.critical_count || 0,
    high: summary.high_count || 0,
    medium: summary.medium_count || 0,
    low: summary.low_count || 0,
  };
  const total = counts.critical + counts.high + counts.medium + counts.low || 1;
  const hasCritical = counts.critical > 0;

  return (
    <div className={`bg-bg-card border border-border-subtle rounded-xl p-4 ${hasCritical ? 'animate-pulse-red' : ''}`}>
      <div className="flex h-3 rounded-full overflow-hidden mb-3 bg-bg-elevated">
        {LEVELS.map(({ key, color }) => {
          const width = (counts[key] / total) * 100;
          if (width === 0) return null;
          return (
            <div
              key={key}
              className={`${color} transition-all`}
              style={{ width: `${width}%` }}
              title={`${key}: ${counts[key]}`}
            />
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onFilterChange(null)}
          className={`text-xs px-2 py-1 rounded transition ${!activeFilter ? 'bg-bg-elevated text-white' : 'text-gray-400 hover:text-white'}`}
        >All</button>
        {LEVELS.map(({ key, label, dot }) => (
          <button
            key={key}
            onClick={() => onFilterChange(activeFilter === key ? null : key)}
            className={`text-xs px-2 py-1 rounded transition ${activeFilter === key ? 'bg-bg-elevated text-white' : 'text-gray-400 hover:text-white'}`}
          >
            {dot} {label}: {counts[key]}
          </button>
        ))}
      </div>
    </div>
  );
}
