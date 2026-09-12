import { useEffect, useRef } from 'react';
import { tasksService } from '@/api/chronoService';
import { useAuth } from '@/lib/AuthContext';

const pad = (value) => String(value).padStart(2, '0');
const localDate = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const localTime = (date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`;

async function notify(task) {
  const title = task.title || task.task || 'Chrono reminder';
  const body = task.description || task.tip || 'Your scheduled task is due.';
  if (globalThis.__TAURI_INTERNALS__) {
    const { isPermissionGranted, requestPermission, sendNotification } = await import('@tauri-apps/plugin-notification');
    let granted = await isPermissionGranted();
    if (!granted) granted = (await requestPermission()) === 'granted';
    if (granted) sendNotification({ title, body });
    return;
  }
  if ('Notification' in window) {
    let permission = Notification.permission;
    if (permission === 'default') permission = await Notification.requestPermission();
    if (permission === 'granted') new Notification(title, { body });
  }
}

export default function DesktopReminderService() {
  const { isAuthenticated } = useAuth();
  const fired = useRef(new Set());

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    const poll = async () => {
      const prefs = { desktop: true, lead: '5', ...JSON.parse(localStorage.getItem('chrono-preferences') || '{}') };
      if (!prefs.desktop) return;
      const now = new Date();
      const date = localDate(now);
      const time = localTime(now);
      try {
        const tasks = await tasksService.list(250);
        for (const task of tasks) {
          const key = `${date}:${task.id}:${time}`;
          const appliesToday = !task.date || task.date === date;
          const [hours, minutes] = (task.start_time || '00:00').split(':').map(Number);
          const due = new Date(now); due.setHours(hours, minutes, 0, 0); due.setMinutes(due.getMinutes() - Number(prefs.lead || 0));
          const reminderTime = localTime(due);
          if (appliesToday && reminderTime === time && task.status !== 'completed' && !fired.current.has(key)) {
            fired.current.add(key);
            await notify(task);
          }
        }
        if (fired.current.size > 500) fired.current.clear();
      } catch (error) {
        console.error('Chrono reminder check failed', error);
      }
    };
    poll();
    const interval = window.setInterval(poll, 30_000);
    return () => window.clearInterval(interval);
  }, [isAuthenticated]);

  return null;
}
