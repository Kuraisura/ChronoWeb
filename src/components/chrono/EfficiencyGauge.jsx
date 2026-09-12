export default function EfficiencyGauge({ value = 92, label = 'Focus Efficiency', sub = '+4.2% vs 7-day average' }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#2A2A2A" strokeWidth="7" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="#00E5FF"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={offset}
            style={{ filter: 'drop-shadow(0 0 4px #00E5FF88)' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-3xl text-white font-semibold">{value}%</span>
        </div>
      </div>
      <div className="text-sm text-white mt-3">{label}</div>
      <div className="text-xs text-chrono-muted font-mono mt-0.5">{sub}</div>
    </div>
  );
}