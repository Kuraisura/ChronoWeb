import { useEffect, useState } from 'react';
import { tasksService } from '@/api/chronoService';

import { ChevronLeft, ChevronRight, Plus, Clock, MapPin, CalendarSearch } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import TopBar from '@/components/chrono/TopBar';
import PanelToggle from '@/components/chrono/PanelToggle';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import NewTaskDialog from '@/components/chrono/NewTaskDialog';
import { useToast } from '@/components/ui/use-toast';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function Calendar() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [cursor, setCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [panelOpen, setPanelOpen] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const load = () => tasksService.list(250).then(setTasks);
  useEffect(() => { load(); }, []);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [...Array(startOffset).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const dateStr = (d) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const tasksForDate = (date) => tasks
    .filter((task) => !task.date || task.date === date)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const dayName = (date) => new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
  const selectedTasks = selectedDay ? tasksForDate(selectedDay) : [];
  const selectedLabel = selectedDay
    ? new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
    : '';
  const jumpTo = (value) => {
    if (!value) return;
    const date = new Date(`${value}T00:00:00`);
    setCursor(new Date(date.getFullYear(), date.getMonth(), 1));
    setSelectedDay(value);
  };
  const createTask = async (data) => {
    await tasksService.create(data);
    setDialogOpen(false);
    toast({ title: 'Task created', description: data.title });
    load();
  };

  return (
    <>
      <TopBar />
      <div className={`flex-1 grid overflow-hidden ${panelOpen ? 'lg:grid-cols-[1fr_360px]' : 'grid-cols-1'}`}>
        <div className="overflow-auto px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-[11px] font-mono text-chrono-muted tracking-[0.2em]">CALENDAR</div>
              <h1 className="text-3xl font-semibold text-chrono-text mt-1">{monthLabel}</h1>
            </div>
            <div className="flex items-center gap-2">
              {!panelOpen && <PanelToggle open={false} onToggle={() => setPanelOpen(true)} />}
              <label className="flex items-center gap-2 h-9 px-3 rounded-md border border-chrono-border text-chrono-muted hover:text-chrono-text focus-within:border-chrono-accent/60 motion-button">
                <CalendarSearch size={15} />
                <span className="text-xs hidden xl:inline">Jump to date</span>
                <input type="date" aria-label="Jump to date" value={selectedDay || ''} onChange={(event) => jumpTo(event.target.value)} className="calendar-date-input bg-transparent text-xs text-chrono-text outline-none" />
              </label>
              <button onClick={() => setCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1))} className="motion-button h-9 px-3 rounded-md border border-chrono-border text-xs text-chrono-muted hover:text-chrono-text">Today</button>
              <button
                onClick={() => setCursor(new Date(year, month - 1, 1))}
                className="motion-button w-9 h-9 rounded-md border border-chrono-border text-chrono-muted hover:text-chrono-text hover:bg-chrono-text/5 flex items-center justify-center"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setCursor(new Date(year, month + 1, 1))}
                className="motion-button w-9 h-9 rounded-md border border-chrono-border text-chrono-muted hover:text-chrono-text hover:bg-chrono-text/5 flex items-center justify-center"
              >
                <ChevronRight size={16} />
              </button>
              <button onClick={() => setDialogOpen(true)} className="motion-button ml-2 bg-chrono-accent text-black text-sm font-medium px-4 py-2 rounded-md hover:opacity-90 flex items-center gap-1.5">
                <Plus size={16} /> New Task
              </button>
            </div>
          </div>

          <motion.div key={`${year}-${month}`} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="grid grid-cols-7 gap-2">
            {WEEKDAYS.map((d) => (
              <div key={d} className="text-[11px] font-mono text-chrono-muted tracking-wider text-center pb-2">
                {d}
              </div>
            ))}
            {cells.map((d, i) => {
              if (!d) return <div key={i} className="aspect-square rounded-lg border border-chrono-border-soft" />;
              const dayTasks = tasksForDate(dateStr(d));
              const isToday = dateStr(d) === new Date().toLocaleDateString('en-CA');
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(dateStr(d))}
                  className={`min-h-[88px] rounded-lg border p-2 flex flex-col gap-1 text-left transition-colors hover:border-chrono-accent/50 ${
                    isToday ? 'border-chrono-accent bg-chrono-surface' : 'border-chrono-border bg-chrono-surface/50'
                  }`}
                >
                  <span className={`text-xs font-mono ${isToday ? 'text-chrono-accent' : 'text-chrono-muted'}`}>{d}</span>
                  {dayTasks.slice(0, 3).map((t) => (
                    <div
                      key={t.id}
                      className={`text-[10px] truncate px-1.5 py-0.5 rounded ${
                        t.status === 'in_progress'
                          ? 'bg-chrono-accent/15 text-chrono-accent'
                          : t.status === 'completed'
                          ? 'bg-chrono-text/5 text-chrono-dim'
                          : 'bg-chrono-text/5 text-chrono-muted'
                      }`}
                    >
                      {t.start_time} {t.title}
                    </div>
                  ))}
                  {dayTasks.length > 3 && <span className="text-[10px] text-chrono-dim">+{dayTasks.length - 3} more</span>}
                </button>
              );
            })}
          </motion.div>
        </div>

        <AnimatePresence>{panelOpen && (
          <motion.aside initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }} transition={{ duration: 0.22 }} className="overflow-auto border-l border-chrono-border bg-chrono-bg hidden lg:block">
            <div className="flex justify-end px-6 pt-6 pb-4">
              <PanelToggle open onToggle={() => setPanelOpen(false)} />
            </div>
            <div className="px-6 pb-6 space-y-4">
              <div className="rounded-lg border border-chrono-border bg-chrono-surface p-5">
                <div className="text-[10px] font-mono text-chrono-muted tracking-wider mb-3">UPCOMING THIS WEEK</div>
                <div className="space-y-3">
                  {tasks
                    .filter((t) => t.status !== 'completed')
                    .slice(0, 5)
                    .map((t) => (
                      <div key={t.id} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-chrono-accent mt-1.5 shrink-0" />
                        <div>
                          <div className="text-sm text-chrono-text">{t.title}</div>
                          <div className="text-xs font-mono text-chrono-muted">
                            {t.date ? dayName(t.date) : 'Daily'} • {t.start_time}
                          </div>
                        </div>
                      </div>
                    ))}
                  {tasks.length === 0 && <div className="text-sm text-chrono-muted">No upcoming tasks.</div>}
                </div>
              </div>
            </div>
          </motion.aside>
        )}</AnimatePresence>
      </div>

      <Dialog open={!!selectedDay} onOpenChange={(o) => !o && setSelectedDay(null)}>
        <DialogContent className="bg-chrono-surface border-chrono-border text-chrono-text max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-chrono-text">{selectedLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {selectedTasks.length === 0 && (
              <div className="text-sm text-chrono-muted">No tasks scheduled for this day.</div>
            )}
            {selectedTasks.map((t) => (
              <div key={t.id} className="rounded-lg border border-chrono-border p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-xs text-chrono-muted">
                    {t.start_time} - {t.end_time}
                  </span>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                      t.status === 'in_progress'
                        ? 'border-chrono-accent/30 text-chrono-accent bg-chrono-accent/10'
                        : 'border-chrono-border text-chrono-muted'
                    }`}
                  >
                    {t.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <div className="text-chrono-text font-medium">{t.title}</div>
                {t.description && <div className="text-sm text-chrono-muted mt-1">{t.description}</div>}
                <div className="flex items-center gap-3 mt-2 text-xs text-chrono-muted">
                  {t.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {t.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {t.duration}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <NewTaskDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onCreate={createTask} />
    </>
  );
}
