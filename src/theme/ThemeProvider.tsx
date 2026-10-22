import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ACCENT_THEMES,
  DEFAULT_ACCENT,
  DEFAULT_MODE,
  isAccentId,
  type AccentId,
  type ThemeMode,
} from "./themes";

const MODE_KEY = "kiliplanner-theme-mode";
const ACCENT_KEY = "kiliplanner-theme-accent";

export interface ThemeContextValue {
  /** What the viewer chose: light, dark, or follow the operating system. */
  mode: ThemeMode;
  /** The mode actually in effect once "system" is resolved. */
  resolvedMode: "light" | "dark";
  accent: AccentId;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: AccentId) => void;
  /** Increments whenever the palette changes, so charts can re-read tokens. */
  revision: number;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredMode(): ThemeMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  const stored = window.localStorage.getItem(MODE_KEY);
  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : DEFAULT_MODE;
}

function readStoredAccent(): AccentId {
  if (typeof window === "undefined") return DEFAULT_ACCENT;
  const stored = window.localStorage.getItem(ACCENT_KEY);
  return isAccentId(stored) ? stored : DEFAULT_ACCENT;
}

function systemPrefersDark(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode);
  const [accent, setAccentState] = useState<AccentId>(readStoredAccent);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);
  const [revision, setRevision] = useState(0);

  // Track the operating system preference so "system" mode stays live.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (event: MediaQueryListEvent) => setSystemDark(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const resolvedMode: "light" | "dark" =
    mode === "system" ? (systemDark ? "dark" : "light") : mode;

  // Write the palette onto <html> - the class drives the `dark:` variant and
  // the attribute selects the accent hue.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", resolvedMode === "dark");
    root.dataset.accent = accent;
    root.dataset.theme = resolvedMode;
    root.style.colorScheme = resolvedMode;
    setRevision((value) => value + 1);
  }, [resolvedMode, accent]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(MODE_KEY, next);
    } catch {
      // Private-mode browsers can refuse writes; the session still works.
    }
  }, []);

  const setAccent = useCallback((next: AccentId) => {
    setAccentState(next);
    try {
      window.localStorage.setItem(ACCENT_KEY, next);
    } catch {
      // Ignore - the theme still applies for this session.
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedMode,
      accent,
      setMode,
      setAccent,
      revision,
    }),
    [mode, resolvedMode, accent, setMode, setAccent, revision],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used inside a ThemeProvider");
  }
  return context;
}

export { ACCENT_THEMES };
