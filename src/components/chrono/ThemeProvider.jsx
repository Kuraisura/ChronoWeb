import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);

const STORAGE_KEY = 'chrono-theme';
const getSystem = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return localStorage.getItem(STORAGE_KEY) || 'dark';
  });
  const [system, setSystem] = useState(getSystem);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const handler = (e) => setSystem(e.matches ? 'light' : 'dark');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const resolved = theme === 'system' ? system : theme;

  useEffect(() => {
    const root = document.documentElement;
    if (resolved === 'light') root.classList.add('theme-light');
    else root.classList.remove('theme-light');
  }, [resolved]);

  const setTheme = useCallback((t) => {
    setThemeState(t);
    localStorage.setItem(STORAGE_KEY, t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved }}>{children}</ThemeContext.Provider>
  );
}