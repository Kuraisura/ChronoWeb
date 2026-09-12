import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, CalendarDays, Check, MonitorCog, UserRound } from 'lucide-react';
import TopBar from '@/components/chrono/TopBar';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useTheme } from '@/components/chrono/ThemeProvider';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/api/supabaseClient';
import { userIdentity } from '@/lib/chronoData';
import { LIMITS } from '@/lib/validation';

const TABS = [
  { id: 'general', label: 'General & Appearance', icon: MonitorCog },
  { id: 'notifications', label: 'Notifications & Reminders', icon: Bell },
  { id: 'calendar', label: 'Calendar Sync', icon: CalendarDays },
  { id: 'account', label: 'Account & Data', icon: UserRound },
];
const THEMES = [
  { id: 'dark', name: 'Dark Obsidian', desc: 'Deep graphite with cool highlights' },
  { id: 'light', name: 'Light Titanium', desc: 'Clean silver-white workspace' },
  { id: 'system', name: 'System Auto', desc: 'Follow your Windows appearance' },
];
const DEFAULTS = { chime: true, briefing: true, desktop: true, lead: '5', weekStart: 'monday', recurring: true };

export default function Settings() {
  const { toast } = useToast();
  const { theme, setTheme, resolved } = useTheme();
  const { user, logout, checkUserAuth } = useAuth();
  const identity = userIdentity(user);
  const [tab, setTab] = useState('general');
  const [prefs, setPrefs] = useState(() => ({ ...DEFAULTS, ...JSON.parse(localStorage.getItem('chrono-preferences') || '{}') }));
  const [displayName, setDisplayName] = useState(identity.name);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState('');

  useEffect(() => setDisplayName(identity.name), [identity.name]);
  const update = (key, value) => setPrefs((current) => ({ ...current, [key]: value }));
  const save = () => { localStorage.setItem('chrono-preferences', JSON.stringify(prefs)); toast({ title: 'Preferences saved' }); };
  const saveProfile = async () => {
    const cleanName = displayName.trim();
    if (!cleanName) return setNameError('Enter a display name.');
    if (cleanName.length > LIMITS.displayName) return setNameError(`Keep the display name under ${LIMITS.displayName} characters.`);
    setNameError('');
    setSavingName(true);
    const { error } = await supabase.auth.updateUser({ data: { ...user.user_metadata, full_name: displayName.trim(), name: displayName.trim() } });
    setSavingName(false);
    if (error) return toast({ title: 'Profile update failed', description: error.message, variant: 'destructive' });
    await checkUserAuth();
    toast({ title: 'Profile updated' });
  };

  return <>
    <TopBar />
    <div className="flex-1 overflow-auto px-8 py-6"><div className="max-w-5xl mx-auto">
      <div className="mb-1"><div className="text-[11px] font-mono text-chrono-muted tracking-[0.2em]">PREFERENCES</div><h1 className="text-3xl font-semibold text-chrono-text mt-1">Settings</h1><p className="text-sm text-chrono-muted mt-1.5">Tune Chrono to your schedule and notification habits.</p></div>
      <div className="flex gap-1 mt-6 mb-7 border-b border-chrono-border overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => setTab(id)} className={`relative flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap motion-button ${tab === id ? 'text-chrono-text' : 'text-chrono-muted hover:text-chrono-text'}`}><Icon size={15} /> {label}{tab === id && <motion.span layoutId="settings-tab" className="absolute inset-x-2 bottom-0 h-0.5 bg-chrono-accent" />}</button>)}
      </div>
      <AnimatePresence mode="wait" initial={false}><motion.div key={tab} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.18 }}>
        {tab === 'general' && <GeneralPanel theme={theme} setTheme={setTheme} resolved={resolved} />}
        {tab === 'notifications' && <NotificationsPanel prefs={prefs} update={update} />}
        {tab === 'calendar' && <CalendarPanel prefs={prefs} update={update} />}
        {tab === 'account' && <AccountPanel identity={identity} displayName={displayName} setDisplayName={(value) => { setDisplayName(value); setNameError(''); }} nameError={nameError} saveProfile={saveProfile} savingName={savingName} logout={logout} />}
      </motion.div></AnimatePresence>
      {tab !== 'account' && <div className="flex justify-end pt-6 mt-8 border-t border-chrono-border"><button onClick={save} className="motion-button bg-chrono-accent text-black text-sm font-semibold px-5 py-2.5 rounded-md">Save preferences</button></div>}
    </div></div>
  </>;
}

function GeneralPanel({ theme, setTheme, resolved }) {
  return <section><h2 className="settings-heading">Appearance</h2><div className="grid sm:grid-cols-3 gap-3">
    {THEMES.map((item) => <button key={item.id} onClick={() => setTheme(item.id)} className={`motion-button rounded-lg border p-4 text-left ${theme === item.id ? 'border-chrono-accent bg-chrono-accent/5' : 'border-chrono-border bg-chrono-surface hover:border-chrono-muted'}`}><div className={`h-12 rounded-md border mb-3 ${item.id === 'dark' ? 'bg-[#101316] border-[#2b3138]' : item.id === 'light' ? 'bg-[#f4f6f8] border-[#cbd2d9]' : 'theme-system-swatch'}`} /><div className="flex items-center justify-between text-sm text-chrono-text"><span>{item.name}</span>{theme === item.id && <Check size={15} className="text-chrono-accent" />}</div><div className="text-xs text-chrono-muted mt-1">{item.desc}</div></button>)}
  </div><p className="text-xs font-mono text-chrono-muted mt-4">Active appearance: <span className="text-chrono-accent">{resolved}</span></p></section>;
}

function NotificationsPanel({ prefs, update }) {
  return <section className="space-y-3"><h2 className="settings-heading">Notifications and reminders</h2><SettingCard title="Desktop notifications" description="Show a native Windows notification when a scheduled task is due"><Switch checked={prefs.desktop} onCheckedChange={(value) => update('desktop', value)} /></SettingCard><SettingCard title="Notification sound" description="Play a short chime with reminders"><Switch checked={prefs.chime} onCheckedChange={(value) => update('chime', value)} /></SettingCard><SettingCard title="Reminder lead time" description="Choose how early Chrono should remind you"><Select value={prefs.lead} onChange={(value) => update('lead', value)} options={[['0','At start'],['5','5 minutes'],['10','10 minutes'],['15','15 minutes'],['30','30 minutes']]} /></SettingCard><SettingCard title="Daily briefing" description="Summarize today’s schedule when Chrono first opens"><Switch checked={prefs.briefing} onCheckedChange={(value) => update('briefing', value)} /></SettingCard></section>;
}

function CalendarPanel({ prefs, update }) {
  return <section className="space-y-3"><h2 className="settings-heading">Calendar sync</h2><div className="rounded-lg border border-chrono-border bg-chrono-surface p-5"><div className="flex items-start gap-3"><CalendarDays className="text-chrono-accent mt-0.5" size={20} /><div><h3 className="text-sm font-medium text-chrono-text">Chrono schedule</h3><p className="text-xs text-chrono-muted mt-1 max-w-xl">The calendar reads the same authenticated Supabase tasks as Schedule. Changes appear in both views without a third-party calendar connection.</p></div></div></div><SettingCard title="Week starts on" description="Used by calendar navigation"><Select value={prefs.weekStart} onChange={(value) => update('weekStart', value)} options={[['monday','Monday'],['sunday','Sunday']]} /></SettingCard><SettingCard title="Show recurring tasks" description="Include tasks without a fixed date"><Switch checked={prefs.recurring} onCheckedChange={(value) => update('recurring', value)} /></SettingCard></section>;
}

function AccountPanel({ identity, displayName, setDisplayName, nameError, saveProfile, savingName, logout }) {
  return <section><h2 className="settings-heading">Account and data</h2><div className="rounded-lg border border-chrono-border bg-chrono-surface p-5 flex items-center gap-4 mb-4">{identity.avatarUrl ? <img src={identity.avatarUrl} alt={identity.name} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-chrono-accent text-black font-bold flex items-center justify-center">{identity.initials}</div>}<div className="min-w-0"><div className="text-chrono-text font-medium truncate">{identity.name}</div><div className="text-xs text-chrono-muted truncate">{identity.email}</div></div></div><label className="block text-xs text-chrono-muted mb-2" htmlFor="display-name">Display name</label><div className="flex gap-2 max-w-xl"><input id="display-name" value={displayName} maxLength={LIMITS.displayName + 1} aria-invalid={!!nameError} onChange={(event) => setDisplayName(event.target.value)} className="flex-1 bg-chrono-surface border border-chrono-border rounded-md px-3 py-2 text-sm text-chrono-text outline-none focus:border-chrono-accent" /><button onClick={saveProfile} disabled={savingName} className="motion-button bg-chrono-accent text-black text-sm font-semibold px-4 py-2 rounded-md disabled:opacity-50">{savingName ? 'Saving…' : 'Update profile'}</button></div>{nameError && <p className="form-error" role="alert">{nameError}</p>}<div className="mt-8 pt-5 border-t border-chrono-border"><button onClick={() => logout()} className="motion-button border border-chrono-border text-chrono-text text-sm px-4 py-2 rounded-md hover:border-chrono-danger hover:text-chrono-danger">Sign out</button></div></section>;
}

function SettingCard({ title, description, children }) { return <div className="rounded-lg border border-chrono-border bg-chrono-surface px-5 py-4 flex items-center justify-between gap-6"><div><div className="text-sm text-chrono-text">{title}</div><div className="text-xs text-chrono-muted mt-1">{description}</div></div><div className="shrink-0">{children}</div></div>; }
function Select({ value, onChange, options }) { return <select value={value} onChange={(event) => onChange(event.target.value)} className="bg-chrono-bg border border-chrono-border text-chrono-text text-sm rounded-md px-3 py-2 outline-none focus:border-chrono-accent">{options.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select>; }
