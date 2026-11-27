import { useSyncExternalStore } from 'react';

/**
 * Tema de la app (spec-b3-tema-sistema). La preferencia es `system` (por defecto, sin clave
 * guardada), `light` o `dark`; `theme` es el tema que se ve. index.html repite la lectura
 * para la primera pintura.
 */
const KEY = 'theme';
const THEMES = ['light', 'dark'];

// Estado global fuera del hook para sincronizar múltiples componentes
let state = { preference: 'system', theme: 'light' };
let started = false;
const listeners = new Set();

// El almacenamiento y matchMedia pueden faltar o lanzar (modo privado, datos bloqueados).
const readPreference = () => {
  try {
    const stored = window.localStorage.getItem(KEY);
    return THEMES.includes(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
};

const writePreference = (preference) => {
  try {
    if (preference === 'system') window.localStorage.removeItem(KEY);
    else window.localStorage.setItem(KEY, preference);
  } catch {
    // Sin almacenamiento, la elección dura lo que la sesión.
  }
};

const systemQuery = () => {
  try {
    return window.matchMedia?.('(prefers-color-scheme: dark)') ?? null;
  } catch {
    return null;
  }
};

const systemTheme = () => (systemQuery()?.matches ? 'dark' : 'light');

const apply = (preference) => {
  state = { preference, theme: preference === 'system' ? systemTheme() : preference };
  const root = document.documentElement;
  root.classList.toggle('dark', state.theme === 'dark');
  // La barra del navegador toma el fondo del tema (tokens.css es la única fuente).
  const canvas = window.getComputedStyle(root).getPropertyValue('--canvas').trim();
  if (canvas) {
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', `rgb(${canvas.split(/\s+/).join(', ')})`);
  }
  listeners.forEach((listener) => listener());
};

/** Aplica la preferencia guardada y empieza a escuchar al sistema. Solo actúa la primera vez. */
export const initTheme = () => {
  if (started || typeof window === 'undefined') return;
  started = true;
  const query = systemQuery();
  const onChange = () => {
    if (state.preference === 'system') apply('system');
  };
  // Safari < 14 solo tiene addListener.
  if (query?.addEventListener) query.addEventListener('change', onChange);
  else query?.addListener?.(onChange);
  apply(readPreference());
};

const setPreference = (preference) => {
  writePreference(preference);
  apply(preference);
};

/** Alterna claro/oscuro; si el resultado es el del sistema, se vuelve a seguirlo. */
const toggleTheme = () => {
  const next = state.theme === 'dark' ? 'light' : 'dark';
  setPreference(next === systemTheme() ? 'system' : next);
};

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getState = () => {
  initTheme();
  return state;
};

export const useTheme = () => {
  const { theme, preference } = useSyncExternalStore(subscribe, getState, getState);
  return { theme, preference, toggleTheme, setPreference };
};
