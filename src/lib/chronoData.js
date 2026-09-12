export function userIdentity(user) {
  const metadata = user?.user_metadata || {};
  const name = metadata.full_name || metadata.name || metadata.display_name || user?.email?.split('@')[0] || 'Chrono user';
  const email = user?.email || '';
  const avatarUrl = metadata.avatar_url || metadata.picture || '';
  const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'CU';
  return { name, email, avatarUrl, initials };
}

export function durationMinutes(value = '') {
  const text = String(value).toLowerCase();
  const hours = Number(text.match(/([\d.]+)\s*h/)?.[1] || 0);
  const minutes = Number(text.match(/([\d.]+)\s*m/)?.[1] || 0);
  if (hours || minutes) return Math.round(hours * 60 + minutes);
  const numeric = Number(text.match(/[\d.]+/)?.[0] || 0);
  return text.includes('hour') ? Math.round(numeric * 60) : Math.round(numeric);
}

export function formatMinutes(total = 0) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (!hours) return `${minutes}m`;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

export function localISODate(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

export function weekTaskHours(tasks) {
  const now = new Date();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const iso = localISODate(date);
    const minutes = tasks.filter((task) => task.date === iso).reduce((sum, task) => sum + durationMinutes(task.duration), 0);
    return { day: date.toLocaleDateString(undefined, { weekday: 'short' }), hrs: Number((minutes / 60).toFixed(2)) };
  });
}
