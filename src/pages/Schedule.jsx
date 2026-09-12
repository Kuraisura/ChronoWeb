import { useEffect, useState } from 'react';
import { tasksService, journalService } from '@/api/chronoService';

import { Plus } from 'lucide-react';
import TopBar from '@/components/chrono/TopBar';
import TaskCard from '@/components/chrono/TaskCard';
import FocusPanel from '@/components/chrono/FocusPanel';
import NewTaskDialog from '@/components/chrono/NewTaskDialog';
import PanelToggle from '@/components/chrono/PanelToggle';
import { useToast } from '@/components/ui/use-toast';
import { durationMinutes, formatMinutes } from '@/lib/chronoData';
import { AnimatePresence, motion } from 'framer-motion';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'completed', label: 'Completed' },
];

export default function Schedule() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [activeId, setActiveId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);

  const load = async () => {
    const data = await tasksService.list(50);
    setTasks(data);
    const inProg = data.find((t) => t.status === 'in_progress');
    setActiveId((prev) => prev || inProg?.id || data[0]?.id || null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const counts = {
    all: tasks.length,
    in_progress: tasks.filter((t) => t.status === 'in_progress').length,
    upcoming: tasks.filter((t) => t.status === 'upcoming').length,
    completed: tasks.filter((t) => t.status === 'completed').length,
  };

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);
  const activeTask = tasks.find((t) => t.id === activeId) || tasks.find((t) => t.status === 'in_progress') || null;
  const remaining = tasks.filter((task) => task.status !== 'completed');
  const totalFocus = remaining.reduce((sum, task) => sum + durationMinutes(task.duration), 0);
  const todayLabel = new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' });

  const handleComplete = async (task) => {
    await tasksService.update(task.id, { status: 'completed' });
    toast({ title: 'Task completed', description: task.title });
    load();
  };

  const handleLog = async (task) => {
    await journalService.create({
      title: task.title,
      content: task.description,
      date: task.date,
      category: '',
      duration: task.duration,
      location: task.location,
    });
    toast({ title: 'Logged to journal', description: task.title });
  };

  const handleCreate = async (data) => {
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
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="text-[11px] font-mono text-chrono-muted tracking-[0.2em]">STATION SCHEDULE</div>
              <h1 className="text-3xl font-semibold text-chrono-text mt-1">{todayLabel}</h1>
              <div className="text-sm text-chrono-muted mt-1.5">
                {remaining.length} tasks remaining • {formatMinutes(totalFocus)} scheduled
                {activeTask?.status === 'in_progress' && <span className="text-chrono-accent"> • Session active</span>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!panelOpen && <PanelToggle open={false} onToggle={() => setPanelOpen(true)} />}
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                onClick={() => setDialogOpen(true)}
                className="bg-chrono-accent text-black text-sm font-medium px-4 py-2.5 rounded-md hover:opacity-90 transition-opacity flex items-center gap-1.5 shrink-0"
              >
                <Plus size={16} /> New Task
              </motion.button>
            </div>
          </div>

          <div className="flex gap-1 mt-6 mb-5 border-b border-chrono-border">
            {FILTERS.map((f) => (
              <motion.button layout
                key={f.key}
                onClick={() => setFilter(f.key)}
                whileTap={{ scale: 0.97 }} className={`relative px-4 py-2.5 text-sm transition-colors -mb-px ${
                  filter === f.key
                    ? 'text-chrono-text'
                    : 'text-chrono-muted hover:text-chrono-text'
                }`}
              >
                {f.label} <span className="text-xs font-mono">({counts[f.key]})</span>
                {filter === f.key && <motion.span layoutId="schedule-tab" className="absolute inset-x-2 bottom-0 h-0.5 bg-chrono-accent" />}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="popLayout"><motion.div layout className="space-y-3">
            {loading && <div className="text-chrono-muted text-sm">Loading schedule…</div>}
            {!loading && filtered.length === 0 && (
              <div className="text-chrono-muted text-sm py-12 text-center">No tasks in this view.</div>
            )}
            {filtered.map((task) => (
              <motion.div layout key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}>
              <TaskCard
                task={task}
                isActive={task.id === activeTask?.id}
                onSelect={() => setActiveId(task.id)}
                onComplete={handleComplete}
                onLog={handleLog}
              />
              </motion.div>
            ))}
          </motion.div></AnimatePresence>
        </div>

        {panelOpen && (
          <div className="overflow-auto border-l border-chrono-border bg-chrono-bg hidden lg:block">
            <div className="flex justify-end px-5 pt-4">
              <PanelToggle open onToggle={() => setPanelOpen(false)} />
            </div>
            <div className="px-5 pb-6">
              <FocusPanel task={activeTask} onChanged={load} />
            </div>
          </div>
        )}
      </div>

      <NewTaskDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onCreate={handleCreate} />
    </>
  );
}
