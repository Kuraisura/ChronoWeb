import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

export default function TopBar() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const pad = (n) => String(n).padStart(2, '0');
  let h = now.getHours();
  const m = pad(now.getMinutes());
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const localTime = `${h}:${m}${ampm}`;
  const offset = -now.getTimezoneOffset() / 60;
  const offsetStr = `UTC${offset >= 0 ? '+' : ''}${offset}`;

  return (
    <header className="flex items-center gap-4 px-6 py-3 border-b border-chrono-border bg-chrono-bg/80 backdrop-blur">
      <div className="flex items-center gap-2.5 flex-1 max-w-xl bg-chrono-surface border border-chrono-border rounded-md px-3 py-2 focus-within:border-chrono-accent/50 transition-colors">
        <Search size={15} className="text-chrono-muted shrink-0" />
        <input
          placeholder="Search tasks, notes, calendar events, or jump to..."
          className="bg-transparent flex-1 text-sm text-chrono-text placeholder:text-chrono-dim outline-none min-w-0"
        />
        <kbd className="text-[10px] text-chrono-muted border border-chrono-border rounded px-1.5 py-0.5 font-mono shrink-0">⌘K</kbd>
      </div>
      <div className="ml-auto text-xs font-mono text-chrono-muted whitespace-nowrap hidden sm:flex items-center gap-2 tabular-nums">
        <span className="text-chrono-text text-sm">{localTime}</span>
        <span className="text-chrono-dim">{offsetStr}</span>
      </div>
    </header>
  );
}
