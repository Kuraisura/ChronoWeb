import { useState, useEffect } from 'react';
import { tasksService } from '@/api/chronoService';

import { Pause, Plus, Clock } from 'lucide-react';
import { durationMinutes, formatMinutes } from '@/lib/chronoData';
import { LIMITS } from '@/lib/validation';

export default function FocusPanel({ task, onChanged }) {
  const [notes, setNotes] = useState(task?.notes || '');

  useEffect(() => {
    setNotes(task?.notes || '');
  }, [task?.id]);

  if (!task) {
    return (
      <div className="text-sm text-chrono-muted p-6">No active focus block.</div>
    );
  }

  const checked = task.checklist?.filter((c) => c.checked).length || 0;
  const total = task.checklist?.length || 0;
  const pct = total ? Math.round((checked / total) * 100) : 0;
  const now = new Date();
  const [startHour, startMinute] = (task.start_time || '00:00').split(':').map(Number);
  const [endHour, endMinute] = (task.end_time || task.start_time || '00:00').split(':').map(Number);
  const start = new Date(now); start.setHours(startHour, startMinute, 0, 0);
  const end = new Date(now); end.setHours(endHour, endMinute, 0, 0);
  const elapsed = Math.max(0, Math.round((now - start) / 60000));
  const remaining = Math.max(0, Math.round((end - now) / 60000));
  const scheduledMinutes = durationMinutes(task.duration) || Math.max(0, Math.round((end - start) / 60000));
  const timePct = scheduledMinutes ? Math.min(100, Math.round((elapsed / scheduledMinutes) * 100)) : 0;
  const progress = total ? pct : timePct;

  const toggleCheck = async (idx) => {
    const checklist = task.checklist.map((c, i) => (i === idx ? { ...c, checked: !c.checked } : c));
    await tasksService.update(task.id, { checklist });
    onChanged?.();
  };

  const saveNotes = async () => {
    if (notes !== (task.notes || '')) {
      await tasksService.update(task.id, { notes });
      onChanged?.();
    }
  };
  const pause = async () => { await tasksService.update(task.id, { status: 'upcoming' }); onChanged?.(); };
  const addTime = async () => {
    const nextEnd = new Date(end); nextEnd.setMinutes(nextEnd.getMinutes() + 15);
    const endTime = `${String(nextEnd.getHours()).padStart(2, '0')}:${String(nextEnd.getMinutes()).padStart(2, '0')}`;
    await tasksService.update(task.id, { end_time: endTime, duration: formatMinutes(scheduledMinutes + 15) }); onChanged?.();
  };

  return (
    <div className="space-y-4">
      {/* Active Focus Block */}
      <div className="rounded-lg border border-chrono-border bg-chrono-surface p-5">
        <div className="text-[10px] font-mono text-chrono-muted tracking-wider mb-1">ACTIVE FOCUS BLOCK</div>
        <div className="text-chrono-text font-semibold mb-3">{task.title}</div>
        <div className="flex items-center justify-between text-xs font-mono text-chrono-muted mb-2">
          <span>SESSION ID #{task.id?.slice(-4).toUpperCase() || '0000'}</span>
          <span className="text-chrono-accent">● ACTIVE</span>
        </div>
        <div className="text-xs font-mono text-chrono-muted mb-1.5">Elapsed: {formatMinutes(Math.min(elapsed, scheduledMinutes))} of {task.duration || formatMinutes(scheduledMinutes)}</div>
        <div className="h-1.5 bg-chrono-border rounded-full overflow-hidden">
          <div className="h-full bg-chrono-accent rounded-full shadow-[0_0_6px_#00E5FF] transition-[width] duration-500" style={{ width: `${progress}%` }} />
        </div>
        <div className="text-[10px] font-mono text-chrono-muted mt-1 text-right">{progress}% complete</div>
      </div>

      {/* Checklist */}
      {total > 0 && (
        <div className="rounded-lg border border-chrono-border bg-chrono-surface p-5">
          <div className="text-[10px] font-mono text-chrono-muted tracking-wider mb-3">CHECKLIST • {checked}/{total}</div>
          <div className="space-y-2.5">
            {task.checklist.map((item, idx) => (
              <button
                key={idx}
                onClick={() => toggleCheck(idx)}
                className="flex items-start gap-2.5 w-full text-left group"
              >
                <span
                  className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                    item.checked ? 'bg-chrono-accent border-chrono-accent' : 'border-chrono-border group-hover:border-chrono-muted'
                  }`}
                >
                  {item.checked && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-6" stroke="#000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className={`text-sm ${item.checked ? 'text-chrono-dim line-through' : 'text-chrono-muted'}`}>
                  {item.text}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Shift Notes */}
      <div className="rounded-lg border border-chrono-border bg-chrono-surface p-5">
        <div className="text-[10px] font-mono text-chrono-muted tracking-wider mb-2">QUICK SHIFT NOTES</div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          maxLength={LIMITS.notes}
          placeholder="Log anomalies, fixes, observations…"
          rows={4}
          className="w-full bg-transparent text-sm text-chrono-muted placeholder:text-chrono-dim outline-none resize-none leading-relaxed"
        />
        <div className="text-[10px] font-mono text-chrono-dim text-right">{notes.length}/{LIMITS.notes}</div>
        <div className="flex gap-2 mt-3">
          <button onClick={pause} className="motion-button flex-1 border border-chrono-border text-chrono-text text-xs py-2 rounded-md hover:bg-chrono-text/5 flex items-center justify-center gap-1.5">
            <Pause size={13} /> Pause
          </button>
          <button onClick={addTime} className="motion-button flex-1 border border-chrono-border text-chrono-text text-xs py-2 rounded-md hover:bg-chrono-text/5 flex items-center justify-center gap-1.5">
            <Plus size={13} /> Add +15m
          </button>
        </div>
      </div>

      {/* Next transition */}
      <div className="rounded-lg border border-chrono-border bg-chrono-surface p-4 flex items-center gap-3">
        <Clock size={16} className="text-chrono-accent" />
        <div className="text-xs">
          <div className="text-chrono-text">Break at {task.end_time}</div>
          <div className="text-chrono-muted font-mono">{formatMinutes(remaining)} remaining</div>
        </div>
      </div>

    </div>
  );
}
