/**
 * Verifies the shipped palette.
 *
 * The palette in `docs/palette.md` is the documented instance. This script is
 * the machine-readable mirror of it: it holds the same values and runs the
 * dataviz validator over them, so the claim "this palette passes" is a
 * repeatable command rather than a sentence in a document.
 *
 * It checks:
 *   - the five family hues, all-pairs, in both modes
 *   - the ink that sits on each family fill
 *   - the status ramp, for every accent theme, in both modes
 *
 * Run: node tools/verify-palette.mjs
 */
import {
  validate,
  validateOrdinal,
} from "file:///C:/Users/USER/AppData/Local/Temp/claude/bundled-skills/2.1.308/d020aa73c5f46e1ba96917817f3195f4/dataviz/scripts/validate_palette.js";
import { oklchToHex, contrastRatio, deltaE, cvdDeltaE } from "./color.mjs";

const SURFACE = { light: "#fcfeff", dark: "#161c22" };

/** The floors, from the validator. */
const NORMAL_FLOOR = 15;
const CVD_TARGET = 8;

/** The five service families. The order is the fixed categorical order. */
const FAMILIES = [
  { key: "security", hue: 27, light: "#c6423b", dark: "#eb6459" },
  { key: "water", hue: 255, light: "#2078da", dark: "#3186e9" },
  { key: "works", hue: 42, light: "#f67742", dark: "#a23a00" },
  { key: "environment", hue: 165, light: "#00b07f", dark: "#00a376" },
  { key: "pollution", hue: 350, light: "#f677b8", dark: "#b73e81" },
];

/**
 * The residual. It is not a sixth identity - it is the bucket for everything
 * that has no family - so it takes a neutral rather than a hue, and it is
 * held to a different standard: it does not have to clear the chroma floor
 * (it is meant to read as gray), but it has to be clearly *separable* from
 * every family, because on the map it sits beside them.
 */
const RESIDUAL = { key: "other", light: "#3f454d", dark: "#a3aeb9" };

/** The ink that sits on each fill, per mode. */
const INKS = {
  light: {
    security: "#ffffff",
    water: "#ffffff",
    works: "#0b0b0b",
    environment: "#0b0b0b",
    pollution: "#0b0b0b",
    other: "#ffffff",
  },
  dark: {
    security: "#0b0b0b",
    water: "#0b0b0b",
    works: "#ffffff",
    environment: "#0b0b0b",
    pollution: "#ffffff",
    other: "#0b0b0b",
  },
};

/** The status ramp's lightness steps, per mode. */
const STATUS_L = {
  light: [0.77, 0.702, 0.634, 0.566, 0.498],
  dark: [0.424, 0.492, 0.56, 0.628, 0.696],
};

const CHROMA_FACTORS = [0.55, 0.7, 0.85, 0.95, 1];

/** The six accent themes. */
const ACCENTS = {
  moss: { hue: 152, chroma: 0.115 },
  ocean: { hue: 244, chroma: 0.125 },
  ember: { hue: 42, chroma: 0.115 },
  plum: { hue: 318, chroma: 0.125 },
  indigo: { hue: 274, chroma: 0.13 },
  slate: { hue: 250, chroma: 0.035 },
};

let failures = 0;
const fail = (message) => {
  failures += 1;
  console.log(`  FAIL  ${message}`);
};

/* ---------------------------------------------------------------- the families */

console.log("FAMILIES");
for (const mode of ["light", "dark"]) {
  const hexes = FAMILIES.map((f) => f[mode]);
  const { report, ok } = validate(hexes, {
    mode,
    surface: SURFACE[mode],
    pairs: "all",
  });
  console.log(`  ${mode}  ${ok ? "PASS" : "FAIL"}`);
  for (const row of report) {
    console.log(`    ${String(row[0]).padEnd(20)} ${row[1]}  ${row[2]}`);
  }
  if (!ok) failures += 1;
}

/* ------------------------------------------------------------------ the residual */

console.log("RESIDUAL");
for (const mode of ["light", "dark"]) {
  const hex = RESIDUAL[mode];
  const families = FAMILIES.map((f) => f[mode]);
  let minNormal = Infinity;
  let minCvd = Infinity;
  for (const family of families) {
    minNormal = Math.min(minNormal, deltaE(hex, family));
    minCvd = Math.min(minCvd, cvdDeltaE(hex, family));
  }
  const contrast = contrastRatio(hex, SURFACE[mode]);
  if (minNormal < NORMAL_FLOOR)
    fail(`residual ${mode}: normal-vision ΔE ${minNormal.toFixed(1)} - below ${NORMAL_FLOOR}`);
  if (minCvd < CVD_TARGET)
    fail(`residual ${mode}: CVD ΔE ${minCvd.toFixed(1)} - below ${CVD_TARGET}`);
  if (contrast < 3)
    fail(`residual ${mode}: ${contrast.toFixed(2)}:1 against the surface - below 3:1`);
  console.log(
    `  ${mode}  ${hex}  normal ΔE ${minNormal.toFixed(1)}  CVD ΔE ${minCvd.toFixed(1)}  ${contrast.toFixed(2)}:1 vs surface`,
  );
}

/* --------------------------------------------------------------------- the inks */

console.log("INK ON FILL (the pin glyph - 3:1, WCAG 1.4.11 non-text contrast)");
for (const mode of ["light", "dark"]) {
  for (const family of [...FAMILIES, RESIDUAL]) {
    const ratio = contrastRatio(INKS[mode][family.key], family[mode]);
    const where = `ink on ${family.key} (${mode})`;
    if (ratio < 3) fail(`${where}: ${ratio.toFixed(2)}:1 - below 3:1`);
    else console.log(`  ${where.padEnd(34)} ${ratio.toFixed(2)}:1`);
  }
}

/* ------------------------------------------------------------------ status ramp */

console.log("STATUS RAMP");
for (const mode of ["light", "dark"]) {
  for (const [accent, { hue, chroma }] of Object.entries(ACCENTS)) {
    const hexes = STATUS_L[mode].map(
      (L, i) => oklchToHex(L, chroma * CHROMA_FACTORS[i], hue),
    );
    const { ok } = validateOrdinal(hexes, { mode, surface: SURFACE[mode] });
    if (!ok) fail(`status ramp ${mode} / ${accent}`);
    else console.log(`  ${mode} / ${accent.padEnd(7)} PASS  ${hexes.join(",")}`);
  }
}

console.log(
  failures === 0
    ? "\nAll checks pass. The palette in docs/palette.md is the shipped one."
    : `\n${failures} check(s) failed.`,
);
process.exit(failures === 0 ? 0 : 1);
