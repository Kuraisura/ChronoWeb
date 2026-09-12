import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Calendar, BookOpen, LayoutGrid, Settings as SettingsIcon, PanelLeftClose, PanelLeftOpen, UserRound } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { userIdentity } from '@/lib/chronoData';
import BrandMark from './BrandMark';

const navItems = [
  { label: 'Schedule', path: '/', icon: LayoutGrid },
  { label: 'Journal', path: '/journal', icon: BookOpen },
  { label: 'Calendar', path: '/calendar', icon: Calendar },
];

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const identity = userIdentity(user);
  const reduceMotion = useReducedMotion();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('chrono-sidebar-collapsed') === 'true');
  const toggle = () => setCollapsed((value) => {
    localStorage.setItem('chrono-sidebar-collapsed', String(!value));
    return !value;
  });
  return (
    <motion.aside
      animate={{ width: collapsed ? 76 : 240 }}
      transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="shrink-0 bg-chrono-surface border-r border-chrono-border flex flex-col h-full overflow-hidden"
    >
      <div className={`py-5 flex items-center px-4 ${collapsed ? 'justify-center gap-1' : 'justify-between'}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <BrandMark className="w-5 h-5 shrink-0" />
          {!collapsed && <span className="font-semibold tracking-[0.25em] text-chrono-text text-base">CHRONO</span>}
        </div>
        <button onClick={toggle} className={`motion-button icon-button ${collapsed ? 'w-8 h-8' : ''}`} title={collapsed ? 'Expand navigation' : 'Collapse navigation'}>{collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={16} />}</button>
      </div>

      <nav className="flex-1 px-3 mt-1 space-y-1">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              title={collapsed ? item.label : undefined}
              className={`relative flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-md text-sm motion-button ${
                active ? 'text-chrono-text bg-chrono-text/[0.04]' : 'text-chrono-muted hover:text-chrono-text hover:bg-chrono-text/[0.02]'
              }`}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-chrono-accent rounded-full shadow-[0_0_6px_#00E5FF]" />
              )}
              <Icon size={16} strokeWidth={1.75} />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 pb-3">
        <Link
          to="/settings"
          title={collapsed ? 'Settings' : undefined}
          className={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-3'} py-2.5 rounded-md text-sm motion-button ${
            location.pathname === '/settings' ? 'text-chrono-text bg-chrono-text/[0.04]' : 'text-chrono-muted hover:text-chrono-text hover:bg-chrono-text/[0.02]'
          }`}
        >
          <SettingsIcon size={16} strokeWidth={1.75} />
          {!collapsed && 'Settings'}
        </Link>
      </div>

      <Link to="/profile" title={collapsed ? identity.name : undefined} className={`flex items-center ${collapsed ? 'justify-center px-0' : 'gap-3 px-4'} py-4 border-t border-chrono-border hover:bg-chrono-text/[0.04] motion-button`}>
        {identity.avatarUrl ? <img src={identity.avatarUrl} alt={identity.name} className="w-9 h-9 rounded-full object-cover shrink-0" /> : (
          <div className="w-9 h-9 rounded-full bg-chrono-accent flex items-center justify-center text-black font-bold text-xs shrink-0">{identity.initials || <UserRound size={15} />}</div>
        )}
        {!collapsed && <div className="flex-1 min-w-0">
          <div className="text-sm text-chrono-text truncate leading-tight">{identity.name}</div>
          <div className="text-xs text-chrono-muted truncate">{identity.email}</div>
        </div>}
      </Link>
    </motion.aside>
  );
}
