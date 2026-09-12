import { useEffect, useState } from 'react';
import { tasksService } from '@/api/chronoService';

import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import TopBar from '@/components/chrono/TopBar';
import { useAuth } from '@/lib/AuthContext';
import { userIdentity, weekTaskHours } from '@/lib/chronoData';

export default function Profile() {
  const { user } = useAuth();
  const identity = userIdentity(user);
  const [tasks, setTasks] = useState([]);
  useEffect(() => {
    tasksService.list(50).then(setTasks);
  }, []);

  const completed = tasks.filter((t) => t.status === 'completed').slice(0, 4);
  const weekData = weekTaskHours(tasks);
  const totalHours = weekData.reduce((sum, day) => sum + day.hrs, 0);
  const peak = weekData.reduce((best, day) => day.hrs > best.hrs ? day : best, weekData[0]);

  return (
    <>
      <TopBar />
      <div className="flex-1 overflow-auto px-8 py-6">
        {/* Hero header */}
        <div className="rounded-lg border border-chrono-border bg-chrono-surface p-6 flex items-start gap-5 mb-6">
          {identity.avatarUrl ? <img src={identity.avatarUrl} alt={identity.name} className="w-16 h-16 rounded-full object-cover shrink-0" /> : <div className="w-16 h-16 rounded-full bg-chrono-accent flex items-center justify-center text-black font-bold text-xl shrink-0">{identity.initials}</div>}
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-chrono-text">{identity.name}</h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-chrono-accent/30 text-chrono-accent bg-chrono-accent/10">
                STUDENT ACCOUNT
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-xs font-mono text-chrono-muted">
              <span>{identity.email}</span>
              <span>{Intl.DateTimeFormat().resolvedOptions().timeZone}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/settings" className="motion-button border border-chrono-border text-chrono-text text-sm px-4 py-2 rounded-md hover:bg-chrono-text/5">
              Edit Profile
            </Link>
          </div>
        </div>

        {/* Weekly chart */}
        <div className="rounded-lg border border-chrono-border bg-chrono-surface p-6 mb-6">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h2 className="text-lg font-semibold text-chrono-text">Weekly Scheduled Hours</h2>
              <div className="text-xs text-chrono-muted mt-0.5">Current week from your Supabase tasks</div>
            </div>
            <div className="text-right">
              <div className="font-mono text-lg text-chrono-text">{totalHours.toFixed(1)} hrs scheduled</div>
              <div className="text-xs text-chrono-accent">{peak?.hrs ? `Peak: ${peak.day}` : 'No scheduled hours'}</div>
            </div>
          </div>
          <div className="h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekData} barSize={36}>
                <XAxis dataKey="day" stroke="#666" tickLine={false} axisLine={false} tick={{ fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Tooltip
                  cursor={{ fill: '#ffffff08' }}
                  contentStyle={{ background: '#141414', border: '1px solid #2A2A2A', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: '#A0A0A0' }}
                />
                <Bar dataKey="hrs" radius={[4, 4, 0, 0]}>
                  {weekData.map((entry, i) => (
                    <Cell key={i} fill={entry.day === peak?.day && peak.hrs ? 'rgb(var(--chrono-accent))' : 'rgb(var(--chrono-border))'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-xs text-chrono-muted mt-2">Average: {(totalHours / 7).toFixed(1)} hrs/day</div>
        </div>

        {/* Recent completed */}
        <div className="rounded-lg border border-chrono-border bg-chrono-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-chrono-text">Recent Completed Tasks</h2>
            <Link to="/" className="text-xs text-chrono-accent hover:underline">View all tasks →</Link>
          </div>
          <div className="space-y-3">
            {completed.length === 0 && <div className="text-sm text-chrono-muted">No completed tasks yet.</div>}
            {completed.map((t) => (
              <div key={t.id} className="flex items-center gap-3 py-2 border-b border-chrono-border-soft last:border-0">
                <span className="w-5 h-5 rounded bg-chrono-accent flex items-center justify-center shrink-0">
                  <Check size={12} className="text-black" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-chrono-text truncate">{t.title}</div>
                  <div className="text-xs text-chrono-muted truncate">{t.description}</div>
                </div>
                {t.category && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-chrono-border text-chrono-muted shrink-0">
                    {t.category}
                  </span>
                )}
                <span className="text-xs font-mono text-chrono-muted shrink-0">{t.duration}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
