import { useState, useEffect, useCallback } from 'react';

// Estado global fuera del hook para sincronizar múltiples componentes
let globalTheme = 'light';
const listeners = new Set();

if (typeof window !== 'undefined') {
  globalTheme = localStorage.getItem('theme') === 'dark' || 
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches) 
    ? 'dark' : 'light';
}

export const useTheme = () => {
  const [theme, setThemeState] = useState(globalTheme);

  useEffect(() => {
    listeners.add(setThemeState);
    return () => listeners.delete(setThemeState);
  }, []);

  const setTheme = useCallback((newTheme) => {
    globalTheme = typeof newTheme === 'function' ? newTheme(globalTheme) : newTheme;
    
    const root = window.document.documentElement;
    if (globalTheme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    
    listeners.forEach(listener => listener(globalTheme));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(globalTheme === 'dark' ? 'light' : 'dark');
  }, [setTheme]);

  return { theme, toggleTheme, setTheme };
};