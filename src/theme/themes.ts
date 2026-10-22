/**
 * Theme catalogue.
 *
 * A colour theme is a hue and a chroma; the light and dark steps of every
 * role are derived in CSS from those two numbers (see `src/index.css`).
 * This module owns the catalogue the switcher renders and the small amount
 * of colour maths the UI needs in JavaScript.
 */

export type AccentId =
  | "moss"
  | "ocean"
  | "ember"
  | "plum"
  | "indigo"
  | "slate";

export type ThemeMode = "light" | "dark" | "system";

export interface AccentTheme {
  id: AccentId;
  label: string;
  /** Short description shown in the switcher. */
  hint: string;
  /** OKLCH hue angle, 0-360. */
  hue: number;
  /** OKLCH chroma - how saturated the theme reads. */
  chroma: number;
}

export const ACCENT_THEMES: AccentTheme[] = [
  {
    id: "moss",
    label: "Moss",
    hint: "Kenyan highland green",
    hue: 152,
    chroma: 0.115,
  },
  {
    id: "ocean",
    label: "Ocean",
    hint: "Civic blue",
    hue: 244,
    chroma: 0.125,
  },
  {
    id: "ember",
    label: "Ember",
    hint: "Terracotta and warm brick",
    hue: 42,
    chroma: 0.115,
  },
  {
    id: "plum",
    label: "Plum",
    hint: "Violet",
    hue: 318,
    chroma: 0.125,
  },
  {
    id: "indigo",
    label: "Indigo",
    hint: "Deep indigo",
    hue: 274,
    chroma: 0.13,
  },
  {
    id: "slate",
    label: "Slate",
    hint: "Neutral graphite",
    hue: 250,
    chroma: 0.035,
  },
];

export const DEFAULT_ACCENT: AccentId = "moss";
export const DEFAULT_MODE: ThemeMode = "system";

export function isAccentId(value: string | null | undefined): value is AccentId {
  return ACCENT_THEMES.some((theme) => theme.id === value);
}

// ---------------------------------------------------------------- colour maths

function srgbToLinear(c: number) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c: number) {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function oklabToLinearSrgb(L: number, a: number, b: number): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

/** OKLCH -> hex, reducing chroma rather than clipping channels to stay in gamut. */
export function oklchToHex(L: number, C: number, H: number): string {
  const hRad = (H * Math.PI) / 180;
  const inGamut = ([r, g, b]: [number, number, number]) =>
    r >= -0.0005 &&
    r <= 1.0005 &&
    g >= -0.0005 &&
    g <= 1.0005 &&
    b >= -0.0005 &&
    b <= 1.0005;

  let lo = 0;
  let hi = C;
  let best = oklabToLinearSrgb(L, C * Math.cos(hRad), C * Math.sin(hRad));

  if (!inGamut(best)) {
    for (let i = 0; i < 32; i += 1) {
      const mid = (lo + hi) / 2;
      const candidate = oklabToLinearSrgb(
        L,
        mid * Math.cos(hRad),
        mid * Math.sin(hRad),
      );
      if (inGamut(candidate)) {
        lo = mid;
        best = candidate;
      } else {
        hi = mid;
      }
    }
  }

  return `#${best
    .map((v) =>
      Math.round(
        Math.min(1, Math.max(0, linearToSrgb(Math.min(1, Math.max(0, v))))) * 255,
      )
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/** The swatch a theme shows in the switcher, matched to its light-mode step. */
export function accentSwatch(theme: AccentTheme): string {
  return oklchToHex(0.5, theme.chroma, theme.hue);
}

/** Ink that reads on top of the swatch. */
export function accentSwatchInk(theme: AccentTheme): string {
  return oklchToHex(0.995, 0.004, theme.hue);
}
