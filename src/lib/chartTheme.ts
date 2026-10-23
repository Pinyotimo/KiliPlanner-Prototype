import { useEffect, useMemo, useState } from "react";
import { useTheme } from "@/theme/ThemeProvider";

/**
 * Chart tokens.
 *
 * Recharts and Chart.js both want literal colour values rather than
 * `var(--token)` strings, so the tokens are read off the document and handed
 * over as resolved colours. Reading them is cheap, but a chart only re-reads
 * when it re-renders - so this hook re-renders whenever the theme changes.
 */
export interface ChartTokens {
  surface: string;
  grid: string;
  axis: string;
  cursor: string;
  primary: string;
  primarySoft: string;
  ink: string;
  inkMuted: string;
  border: string;
  series: string[];
  statusRamp: string[];
  category: Record<string, string>;
}

/**
 * The five service families the categories fold into, plus the residual
 * bucket. The order is fixed - it is the order whose colours stay
 * distinguishable from every other family in both modes.
 */
const CATEGORY_TOKENS = [
  "--category-security",
  "--category-water",
  "--category-works",
  "--category-environment",
  "--category-pollution",
  "--category-other",
];

function readToken(styles: CSSStyleDeclaration, name: string, fallback: string) {
  const value = styles.getPropertyValue(name).trim();
  return value || fallback;
}

function readTokens(): ChartTokens {
  if (typeof window === "undefined") {
    return {
      surface: "#ffffff",
      grid: "#e1e0d9",
      axis: "#898781",
      cursor: "rgba(0,0,0,0.06)",
      primary: "#2a78d6",
      primarySoft: "rgba(42,120,214,0.14)",
      ink: "#0b0b0b",
      inkMuted: "#52514e",
      border: "rgba(11,11,11,0.1)",
      series: [],
      statusRamp: [],
      category: {},
    };
  }

  const styles = getComputedStyle(document.documentElement);
  const category: Record<string, string> = {};
  for (const token of CATEGORY_TOKENS) {
    category[token.replace("--category-", "")] = readToken(styles, token, "#3f454d");
  }

  return {
    surface: readToken(styles, "--chart-surface", "#ffffff"),
    grid: readToken(styles, "--chart-grid", "#e1e0d9"),
    axis: readToken(styles, "--chart-axis", "#898781"),
    cursor: readToken(styles, "--chart-cursor", "rgba(0,0,0,0.06)"),
    primary: readToken(styles, "--primary", "#2a78d6"),
    primarySoft: readToken(
      styles,
      "--primary-soft",
      "color-mix(in oklab, currentColor 12%, transparent)",
    ),
    ink: readToken(styles, "--foreground", "#0b0b0b"),
    inkMuted: readToken(styles, "--muted-foreground", "#52514e"),
    border: readToken(styles, "--border", "rgba(11,11,11,0.1)"),
    series: CATEGORY_TOKENS.map((token) =>
      readToken(styles, token, "#3f454d"),
    ),
    statusRamp: [1, 2, 3, 4, 5].map((step) =>
      readToken(styles, `--status-${step}`, "#2a78d6"),
    ),
    category,
  };
}

/** Resolved chart colours, refreshed whenever the theme changes. */
export function useChartTokens(): ChartTokens {
  const { revision } = useTheme();
  const [tokens, setTokens] = useState<ChartTokens>(readTokens);

  useEffect(() => {
    setTokens(readTokens());
  }, [revision]);

  return tokens;
}

/**
 * A value that changes on every theme change, for libraries that cache their
 * configuration internally (Chart.js reads its options once at mount).
 */
export function useThemeRevision(): number {
  const { revision } = useTheme();
  return revision;
}

/** A transparent version of a colour, for area fills under a line. */
export function withAlpha(color: string, alpha: number): string {
  const clean = color.trim();
  if (clean.startsWith("#")) {
    const hex = clean.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (clean.startsWith("rgb(")) {
    return clean.replace("rgb(", "rgba(").replace(")", `, ${alpha})`);
  }
  if (clean.startsWith("oklch(")) {
    return `color-mix(in oklab, ${clean} ${Math.round(alpha * 100)}%, transparent)`;
  }
  return clean;
}

/** Memoised category colour lookup. */
export function useCategoryColors() {
  const tokens = useChartTokens();
  return useMemo(() => tokens.category, [tokens]);
}
