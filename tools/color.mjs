/**
 * Colour utilities for the KiliPlanner theme system.
 *
 * - `oklch(L C H)` -> hex, so OKLCH tokens can be fed to the dataviz palette validator
 * - `hex -> oklch(...)`, so hex palettes can be re-expressed as theme tokens
 * - small helpers for tinting/alpha of a base colour
 *
 * Usage:
 *   node tools/color.mjs oklch 0.48 0.12 220
 *   node tools/color.mjs tohex "#2a78d6"
 *   node tools/color.mjs ramp "0.42 0.10 220" 7
 */

// ---------------------------------------------------------------- sRGB <-> OKLab

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearToSrgb(c) {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

function oklabToLinearSrgb(L, a, b) {
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

function linearSrgbToOklab(r, g, b) {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);
  return [
    0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  ];
}

/** OKLCH -> linear sRGB triple (may be out of gamut). */
export function oklchToLinearRgb(L, C, H) {
  const hRad = (H * Math.PI) / 180;
  return oklabToLinearSrgb(L, C * Math.cos(hRad), C * Math.sin(hRad));
}

/** OKLCH -> hex, gamut-clipped by chroma reduction so the hue is preserved. */
export function oklchToHex(L, C, H, { clip = true } = {}) {
  let lo = 0;
  let hi = C;
  let best = oklchToLinearRgb(L, C, H);
  if (clip) {
    const inGamut = ([r, g, b]) =>
      r >= -0.0005 && r <= 1.0005 && g >= -0.0005 && g <= 1.0005 && b >= -0.0005 && b <= 1.0005;
    if (!inGamut(best)) {
      for (let i = 0; i < 40; i += 1) {
        const mid = (lo + hi) / 2;
        const candidate = oklchToLinearRgb(L, mid, H);
        if (inGamut(candidate)) {
          lo = mid;
          best = candidate;
        } else {
          hi = mid;
        }
      }
    }
  }
  const [r, g, b] = best.map((v) => {
    const clamped = Math.min(1, Math.max(0, v));
    return Math.round(linearToSrgb(clamped) * 255);
  });
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

/** hex -> OKLCH triple */
export function hexToOklch(hex) {
  const clean = hex.replace("#", "");
  const r = srgbToLinear(parseInt(clean.slice(0, 2), 16) / 255);
  const g = srgbToLinear(parseInt(clean.slice(2, 4), 16) / 255);
  const b = srgbToLinear(parseInt(clean.slice(4, 6), 16) / 255);
  const [L, a, bb] = linearSrgbToOklab(r, g, b);
  const C = Math.sqrt(a * a + bb * bb);
  let H = (Math.atan2(bb, a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H };
}

// ------------------------------------------------------------- CVD separation

/**
 * The same colour maths the dataviz validator uses, ported so the palette
 * search can prune thousands of candidate steps per second. The Machado-
 * Oliveira-Fernandes (2009) severity-1.0 transforms and the OKLab distance
 * are identical to `validate_palette.js` - the results agree.
 */
const MACHADO = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

function linearOf(hex) {
  const clean = hex.replace("#", "");
  return [0, 2, 4].map((i) =>
    srgbToLinear(parseInt(clean.slice(i, i + 2), 16) / 255),
  );
}

function simulate(hex, kind) {
  const rgb = linearOf(hex);
  const M = MACHADO[kind];
  const clamp = (c) => Math.max(0, Math.min(1, c));
  return [
    clamp(M[0][0] * rgb[0] + M[0][1] * rgb[1] + M[0][2] * rgb[2]),
    clamp(M[1][0] * rgb[0] + M[1][1] * rgb[1] + M[1][2] * rgb[2]),
    clamp(M[2][0] * rgb[0] + M[2][1] * rgb[1] + M[2][2] * rgb[2]),
  ];
}

function oklabOf(rgb) {
  return linearSrgbToOklab(rgb[0], rgb[1], rgb[2]);
}

/** OKLab distance x100. Without `kind`, unsimulated (normal) vision. */
export function deltaE(a, b, kind) {
  const la = oklabOf(kind ? simulate(a, kind) : linearOf(a));
  const lb = oklabOf(kind ? simulate(b, kind) : linearOf(b));
  return 100 * Math.hypot(la[0] - lb[0], la[1] - lb[1], la[2] - lb[2]);
}

/** Worst protan/deutan distance between two colours. */
export function cvdDeltaE(a, b) {
  return Math.min(deltaE(a, b, "protan"), deltaE(a, b, "deutan"));
}

/** WCAG contrast ratio between two hex colours. */
export function contrastRatio(a, b) {
  const lum = (hex) => {
    const [r, g, bl] = linearOf(hex);
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** hex with an alpha channel, as an 8-digit hex (browser-parseable). */
export function alpha(hex, a) {
  const clean = hex.replace("#", "");
  const value = Math.round(Math.min(1, Math.max(0, a)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `#${clean}${value}`;
}

/** Mix two hex colours in linear-light space. */
export function mix(a, b, t) {
  const parse = (hex) => {
    const clean = hex.replace("#", "");
    return [0, 2, 4].map((i) => srgbToLinear(parseInt(clean.slice(i, i + 2), 16) / 255));
  };
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  const out = [r1, g1, b1].map((v, i) => linearToSrgb(v + (parse(b)[i] - v) * t));
  return `#${out
    .map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

// ---------------------------------------------------------------------- CLI

if (process.argv[1] && process.argv[1].endsWith("color.mjs")) {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === "oklch") {
    const [L, C, H] = rest.map(Number);
    const hex = oklchToHex(L, C, H);
    console.log(`${hex}  (oklch(${L} ${C} ${H}))`);
  } else if (cmd === "tohex") {
    console.log(rest[0]);
  } else if (cmd === "inspect") {
    for (const hex of rest) {
      const { L, C, H } = hexToOklch(hex);
      console.log(
        `${hex}  L=${L.toFixed(3)} C=${C.toFixed(3)} H=${H.toFixed(1)}  -> oklch(${L.toFixed(3)} ${C.toFixed(3)} ${H.toFixed(1)})`,
      );
    }
  } else if (cmd === "ramp") {
    const [L, C, H] = rest[0].split(" ").map(Number);
    const steps = Number(rest[1] ?? 7);
    for (let i = 0; i < steps; i += 1) {
      const t = steps === 1 ? 0 : i / (steps - 1);
      const l = L + (0.95 - L) * t;
      console.log(oklchToHex(l, C, H), `oklch(${l.toFixed(3)} ${C} ${H})`);
    }
  } else {
    console.log("usage: color.mjs oklch L C H | inspect <hex...> | ramp '<L> <C> <H>' <steps>");
  }
}
