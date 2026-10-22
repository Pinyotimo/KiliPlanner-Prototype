/**
 * Design + validation harness for the KiliPlanner theme system.
 *
 * 1. Builds candidate surface ramps for light and dark.
 * 2. Checks text/mark contrast for every role that carries meaning.
 * 3. Enumerates display orders for the issue-category palette and keeps only
 *    orders whose *adjacent* pairs clear the CVD + normal-vision floors.
 *
 * Run: node tools/design-colors.mjs
 */
import { validate, contrast } from "file:///C:/Users/USER/AppData/Local/Temp/claude/bundled-skills/2.1.308/d020aa73c5f46e1ba96917817f3195f4/dataviz/scripts/validate_palette.js";
import { oklchToHex, hexToOklch } from "./color.mjs";

// ---------------------------------------------------------------- accents

export const ACCENTS = [
  { id: "moss", label: "Moss", hue: 152, chroma: 0.115 },
  { id: "ocean", label: "Ocean", hue: 244, chroma: 0.125 },
  { id: "ember", label: "Ember", hue: 42, chroma: 0.115 },
  { id: "plum", label: "Plum", hue: 318, chroma: 0.125 },
  { id: "indigo", label: "Indigo", hue: 274, chroma: 0.13 },
  { id: "slate", label: "Slate", hue: 250, chroma: 0.035 },
];

const P = (L, C, H) => oklchToHex(L, C, H);

// ---------------------------------------------------------------- surfaces

const SURFACES = {
  light: {
    page: P(0.968, 0.008, 250),
    card: P(0.995, 0.005, 250),
    raised: P(0.945, 0.011, 250),
    border: P(0.87, 0.014, 250),
    borderStrong: P(0.79, 0.018, 250),
    ink: P(0.235, 0.015, 250),
    inkMuted: P(0.505, 0.018, 250),
  },
  dark: {
    page: P(0.175, 0.013, 250),
    card: P(0.222, 0.015, 250),
    raised: P(0.268, 0.017, 250),
    border: P(0.36, 0.021, 250),
    borderStrong: P(0.45, 0.022, 250),
    ink: P(0.955, 0.006, 250),
    inkMuted: P(0.7, 0.016, 250),
  },
};

// ---------------------------------------------------------------- brand roles

function brandRoles(accent, mode) {
  const { hue, chroma } = accent;
  if (mode === "light") {
    return {
      primary: P(0.5, chroma, hue),
      primaryInk: P(0.995, 0.004, hue),
      accent: P(0.945, chroma * 0.28, hue),
      accentInk: P(0.4, chroma * 0.85, hue),
      ring: P(0.55, chroma, hue),
    };
  }
  return {
    primary: P(0.74, chroma * 0.92, hue),
    primaryInk: P(0.2, 0.02, hue),
    accent: P(0.3, chroma * 0.4, hue),
    accentInk: P(0.88, chroma * 0.45, hue),
    ring: P(0.7, chroma * 0.9, hue),
  };
}

// ---------------------------------------------------------------- report

let failures = 0;
function check(label, value, min, mode) {
  const ok = value >= min;
  if (!ok) failures += 1;
  const tag = ok ? "PASS" : "FAIL";
  console.log(
    `  ${tag}  ${label.padEnd(46)} ${value.toFixed(2)}:1  (need ${min}:1) [${mode}]`,
  );
}

console.log("\n=== Surfaces & ink ===");
for (const mode of ["light", "dark"]) {
  const s = SURFACES[mode];
  const chartSurface = s.card;
  console.log(`\n-- ${mode} --  page ${s.page}  card ${chartSurface}`);
  check("ink on page", contrast(s.ink, s.page), 4.5, mode);
  check("ink on card", contrast(s.ink, s.card), 4.5, mode);
  check("muted ink on page", contrast(s.inkMuted, s.page), 4.5, mode);
  check("muted ink on card", contrast(s.inkMuted, s.card), 4.5, mode);
  check("border on card (non-text, >=1.4)", contrast(s.border, s.card), 1.4, mode);
  check("borderStrong on card (non-text, >=2)", contrast(s.borderStrong, s.card), 2.0, mode);
  check("raised surface on page (>=1.05)", contrast(s.raised, s.page), 1.05, mode);
}

console.log("\n=== Brand roles per accent ===");
for (const accent of ACCENTS) {
  console.log(`\n-- ${accent.label} (hue ${accent.hue}) --`);
  for (const mode of ["light", "dark"]) {
    const r = brandRoles(accent, mode);
    const s = SURFACES[mode];
    check("primary ink on primary", contrast(r.primaryInk, r.primary), 4.5, mode);
    check("primary on page (text use)", contrast(r.primary, s.page), 4.5, mode);
    check("primary on card (mark use)", contrast(r.primary, s.card), 3.0, mode);
    check("accent ink on accent", contrast(r.accentInk, r.accent), 4.5, mode);
    check("accent ink on page (text use)", contrast(r.accentInk, s.page), 4.5, mode);
  }
}

// ---------------------------------------------------------------- categories

// Domain identity colours: 7 hues + a neutral "Other" bucket.
// Hues follow the validated reference categorical ramp.
export const CATEGORY_HUES = {
  water: "blue",
  drainage: "blue",
  sewage: "yellow",
  pollution: "magenta",
  waste: "green",
  green_project: "aqua",
  road_damage: "orange",
  construction: "orange",
  encroachment: "violet",
  land_planning: "violet",
  security: "red",
  other: "neutral",
};

const REF_LIGHT = {
  blue: "#2a78d6",
  orange: "#eb6834",
  aqua: "#1baf7a",
  yellow: "#eda100",
  magenta: "#e87ba4",
  green: "#008300",
  violet: "#6250d6",
  red: "#e34948",
};
const REF_DARK = {
  blue: "#3987e5",
  orange: "#d95926",
  aqua: "#199e70",
  yellow: "#c98500",
  magenta: "#d55181",
  green: "#008300",
  violet: "#9085e9",
  red: "#e66767",
};
const NEUTRAL = { light: "#898781", dark: "#898781" };

function categoryHex(name, mode) {
  const hue = CATEGORY_HUES[name];
  if (hue === "neutral") return NEUTRAL[mode];
  return mode === "light" ? REF_LIGHT[hue] : REF_DARK[hue];
}

console.log("\n=== Category palette: all-pairs scan (map markers) ===");
const HUE_NAMES = Object.keys(CATEGORY_HUES).filter(
  (n) => CATEGORY_HUES[n] !== "neutral",
);
const DISTINCT_HUES = [...new Set(HUE_NAMES.map((n) => CATEGORY_HUES[n]))];

for (const mode of ["light", "dark"]) {
  const hexes = DISTINCT_HUES.map((h) => (mode === "light" ? REF_LIGHT[h] : REF_DARK[h]));
  const { report, ok } = validate(hexes, {
    mode,
    surface: SURFACES[mode].card,
    pairs: "all",
  });
  console.log(`\n-- ${mode} (all pairs, ${hexes.length} hues) --`);
  for (const [name, status, detail] of report) {
    console.log(`  ${String(status).padEnd(5)} ${name.padEnd(24)} ${detail}`);
  }
  if (!ok) failures += 1;
}

// ------------------------------------------------------- display-order search
//
// The chart plots categories in a fixed display order, so the colour pairs that
// end up side by side are decided by that order. Enumerate orders and keep only
// those whose adjacent pairs clear the floors in BOTH modes.

console.log("\n=== Display-order enumeration (adjacent pairs) ===");

function* permutations(arr) {
  if (arr.length <= 1) {
    yield arr;
    return;
  }
  for (let i = 0; i < arr.length; i += 1) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const perm of permutations(rest)) yield [arr[i], ...perm];
  }
}

function adjacentOk(order, mode) {
  const hexes = order.map((h) => (mode === "light" ? REF_LIGHT[h] : REF_DARK[h]));
  const { report } = validate(hexes, { mode, surface: SURFACES[mode].card, pairs: "adjacent" });
  const cvd = report.find((r) => r[0] === "CVD separation");
  const nor = report.find((r) => r[0] === "Normal-vision floor");
  const cvdOk = cvd[1] === "pass" || cvd[1] === "floor";
  const norOk = nor[1] === "pass";
  return { cvdOk, norOk, cvd, nor };
}

// Reference order first (it is the known-good ordering of these hues).
const REFERENCE_ORDER = ["blue", "orange", "aqua", "yellow", "magenta", "green", "violet", "red"];

for (const order of permutations(DISTINCT_HUES)) {
  const light = adjacentOk(order, "light");
  const dark = adjacentOk(order, "dark");
  if (light.cvdOk && light.norOk && dark.cvdOk && dark.norOk) {
    console.log(`  OK  ${order.join(" > ")}`);
    console.log(
      `      light ${light.cvd[2].replace(/.*ΔE ([\d.]+).*/, "ΔE $1")} | dark ${dark.cvd[2].replace(/.*ΔE ([\d.]+).*/, "ΔE $1")}`,
    );
  }
}

console.log(
  `\n${failures === 0 ? "ALL CHECKS PASSED" : `${failures} CHECK GROUP(S) NEED WORK`}`,
);

