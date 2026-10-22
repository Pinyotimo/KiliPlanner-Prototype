/**
 * The status ramp.
 *
 * The verification pipeline is an ordered scale, so it takes one hue in
 * stepped lightness rather than categorical colours. Three things have to
 * hold for every accent theme and both modes:
 *
 *   - the step nearest the surface clears 2:1 against it. That step is
 *     status-1 in both modes, and it is the one that would otherwise fade
 *     into the background - it is the lightest step on the light surface and
 *     the darkest on the dark one, and the pipeline chart fills bars with it;
 *   - adjacent steps are far enough apart in lightness to read as separate
 *     stages (Delta L >= 0.06);
 *   - the ramp stays monotone in one hue.
 *
 * The ramp is expressed in the theme's own hue, so it moves with the accent.
 * This script finds the steps that satisfy all of that for all six accents.
 *
 * Run: node tools/status-ramp.mjs
 */
import { validateOrdinal } from "file:///C:/Users/USER/AppData/Local/Temp/claude/bundled-skills/2.1.308/d020aa73c5f46e1ba96917817f3195f4/dataviz/scripts/validate_palette.js";
import { oklchToHex, contrastRatio } from "./color.mjs";

const SURFACE = { light: "#fcfeff", dark: "#161c22" };

/** The six accent themes: hue and chroma. */
const ACCENTS = {
  moss: { hue: 152, chroma: 0.115 },
  ocean: { hue: 244, chroma: 0.125 },
  ember: { hue: 42, chroma: 0.115 },
  plum: { hue: 318, chroma: 0.125 },
  indigo: { hue: 274, chroma: 0.13 },
  slate: { hue: 250, chroma: 0.035 },
};

/** Chroma falls off along the ramp so the pale end does not read as a tint. */
const CHROMA_FACTORS = [0.55, 0.7, 0.85, 0.95, 1];

/** Target gap, with a margin for 8-bit rounding of the hex. */
const GAP = 0.068;

function rampFor(accent, mode, Ls) {
  const { hue, chroma } = ACCENTS[accent];
  return Ls.map((L, i) => oklchToHex(L, chroma * CHROMA_FACTORS[i], hue));
}

/**
 * Status-1 is the step nearest the surface in both modes: the lightest in
 * light mode, the darkest in dark mode. It is the one that must clear 2:1.
 */
function nearEndContrast(accent, mode, Ls) {
  const { hue, chroma } = ACCENTS[accent];
  const hex = oklchToHex(Ls[0], chroma * CHROMA_FACTORS[0], hue);
  return contrastRatio(hex, SURFACE[mode]);
}

for (const mode of ["light", "dark"]) {
  // Light mode: status-1 is the lightest step, so the ramp descends.
  // Dark mode: status-1 is the darkest step, so the ramp ascends.
  const descending = mode === "light";
  const start = descending ? 0.78 : 0.38;
  const end = descending ? 0.4 : 0.74;

  let chosen = null;
  for (let L = start; descending ? L >= end : L <= end; L += descending ? -0.002 : 0.002) {
    const Ls = [0, 1, 2, 3, 4].map((i) =>
      descending ? L - GAP * i : L + GAP * i,
    );
    if (descending ? Ls[4] < 0.3 : Ls[4] > 0.75) continue;
    let worst = Infinity;
    for (const accent of Object.keys(ACCENTS)) {
      worst = Math.min(worst, nearEndContrast(accent, mode, Ls));
    }
    if (worst >= 2.0) {
      chosen = { L, Ls, worst };
      break;
    }
  }

  if (!chosen) {
    console.log(`${mode}: no ramp found`);
    continue;
  }

  console.log(
    `${mode}: status-1 L = ${chosen.L.toFixed(3)}  (steps ${chosen.Ls.map((l) => l.toFixed(3)).join(", ")})`,
  );
  console.log(`   near-end contrast: ${chosen.worst.toFixed(2)}:1 (worst accent)`);

  let allOk = true;
  for (const accent of Object.keys(ACCENTS)) {
    const hexes = rampFor(accent, mode, chosen.Ls);
    const { report, ok } = validateOrdinal(hexes, {
      mode,
      surface: SURFACE[mode],
    });
    allOk = allOk && ok;
    console.log(
      `   ${accent.padEnd(6)} ${hexes.join(",")}  ordinal ${ok ? "PASS" : "FAIL"}`,
    );
    if (!ok) {
      for (const row of report) {
        if (row[1] !== true) console.log(`      ${row[0]}: ${row[1]} - ${row[2]}`);
      }
    }
  }
  console.log(
    `   -> ${mode} L values: ${chosen.Ls.map((l) => l.toFixed(3)).join(", ")}`,
  );
  if (!allOk) console.log(`   !! ${mode} does not pass for every accent`);
}
