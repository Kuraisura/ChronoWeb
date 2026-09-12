import { MapPin, Clock, ListChecks, CheckCircle2, FileText } from 'lucide-react';

const STATUS = {
  in_progress: { label: 'IN PROGRESS', chip: 'bg-chrono-accent/10 text-chrono-accent border-chrono-accent/30' },
  upcoming: { label: 'UPCOMING', chip: 'bg-chrono-text/5 text-chrono-muted border-chrono-border' },
  completed: { label: 'COMPLETED', chip: 'bg-chrono-text/5 text-chrono-dim border-chrono-border' },
};

export default function TaskCard({ task, isActive, onSelect, onComplete, onLog }) {
  const s = STATUS[task.status] || STATUS.upcoming;
  const checked = task.checklist?.filter((c) => c.checked).length || 0;
  const total = task.checklist?.length || 0;

  return (
    <div
      onClick={() => onSelect?.(task)}
      className={`rounded-lg border p-5 cursor-pointer transition-all duration-200 ${
        isActive
          ? 'border-chrono-accent bg-chrono-surface shadow-[0_0_0_1px_#00E5FF33]'
          : 'border-chrono-border bg-chrono-surface hover:border-chrono-border/60'
      } ${task.status === 'completed' ? 'opacity-55' : ''}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs text-chrono-muted">
          {task.start_time} - {task.end_time} • {task.duration} slot
        </span>
        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${s.chip}`}>● {s.label}</span>
      </div>

      <h3 className="text-lg font-semibold text-chrono-text mb-1.5">{task.title}</h3>
      {task.description && (
        <p className="text-sm text-chrono-muted mb-4 leading-relaxed">{task.description}</p>
      )}

      <div className="flex items-center gap-4 text-xs text-chrono-muted mb-4 flex-wrap">
        {task.location && (
          <span className="flex items-center gap-1.5">
            <MapPin size={13} /> {task.location}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Clock size={13} /> {task.duration}
        </span>
        {total > 0 && (
          <span className={`flex items-center gap-1.5 ${task.status === 'in_progress' ? 'text-chrono-accent' : ''}`}>
            <ListChecks size={13} /> Checklist: {checked}/{total} verified
          </span>
        )}
      </div>

      {task.status !== 'completed' && (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onComplete?.(task);
            }}
            className="bg-chrono-accent text-black text-sm font-medium px-4 py-2 rounded-md hover:bg-chrono-accent/90 transition-colors"
          >
            Complete Task
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLog?.(task);
            }}
            className="border border-chrono-border text-chrono-text text-sm px-4 py-2 rounded-md hover:bg-chrono-text/5 transition-colors flex items-center gap-1.5"
          >
            <FileText size={14} /> Log to Journal
          </button>
        </div>
      )}
      {task.status === 'completed' && (
        <div className="flex items-center gap-1.5 text-xs text-chrono-dim">
          <CheckCircle2 size={14} /> Completed
        </div>
      )}
    </div>
  );
}