/* =====================================================================
   Apparence clair / sombre / système
   ---------------------------------------------------------------------
   L'état choisi est écrit dans l'attribut data-theme de <html> (lu par
   src/styles/tokens.css) et mémorisé sous la clé « ka.theme ».
   index.html l'applique avant le premier rendu pour éviter un flash.
   ===================================================================== */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';
import type { Appearance, ThemeMode } from '../model/common';

export const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark'];
const STORAGE_KEY = 'ka.theme';

function readMode(): ThemeMode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  } catch {
    return 'system';
  }
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

interface ThemeContextValue {
  mode: ThemeMode;
  appearance: Appearance;
  setMode: (mode: ThemeMode) => void;
  /** système → clair → sombre → système */
  cycle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readMode);
  const [systemDark, setSystemDark] = useState<boolean>(systemPrefersDark);

  /* En mode « système », suivre le réglage de l'OS sans recharger. */
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return undefined;
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const appearance: Appearance = mode === 'system' ? (systemDark ? 'dark' : 'light') : mode;

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (mode === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', mode);
    const meta = document.head.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', appearance === 'dark' ? '#0E1519' : '#2BBECD');
  }, [mode, appearance]);

  const setMode = useCallback((next: ThemeMode) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* mode privé */
    }
    setModeState(next);
  }, []);

  const cycle = useCallback(() => {
    setModeState((current) => {
      const next = THEME_MODES[(THEME_MODES.indexOf(current) + 1) % THEME_MODES.length];
      try {
        window.localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* mode privé */
      }
      return next;
    });
  }, []);

  const value = useMemo(() => ({ mode, appearance, setMode, cycle }), [mode, appearance, setMode, cycle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme doit être utilisé sous <ThemeProvider>.');
  return ctx;
}
