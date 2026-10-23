/**
 * How many category hues can the map carry?
 *
 * The map is an all-pairs form: any two pins can sit side by side, so every
 * pair of category hues must clear the floors - not just neighbouring ones.
 *
 * Two questions are answered here:
 *
 *   1. Which subsets of the documented 8 slots survive `--pairs all` in both
 *      modes? (documented slots, no re-stepping)
 *   2. If we hold our own ramps, how large a hue set can clear all-pairs once
 *      each hue is re-stepped (lightness swept inside the band, chroma taken
 *      to the gamut edge)? This is the search that decides how many category
 *      hues the map can carry.
 *
 * Rules applied in both cases:
 *   - CVD separation: target >= 8, floor >= 6. The floor band is legal here
 *     because every category mark also carries its own icon (secondary
 *     encoding).
 *   - Normal-vision floor >= 15: a hard gate, no exemption.
 *   - Lightness band and chroma floor per mode.
 *   - Contrast: a "relief" verdict is accepted - it obligates visible labels
 *     (the map legend and the per-pin popup), not a palette change.
 *
 * Run: node tools/map-hues.mjs
 */
import { validate } from "file:///C:/Users/USER/AppData/Local/Temp/claude/bundled-skills/2.1.308/d020aa73c5f46e1ba96917817f3195f4/dataviz/scripts/validate_palette.js";
import { oklchToHex, hexToOklch } from "./color.mjs";

const SURFACE = { light: "#fcfeff", dark: "#161c22" };

/** The documented slots, as (light, dark) pairs. Hue and step are both fixed. */
const SLOTS = [
  { name: "blue", light: "#2a78d6", dark: "#3987e5", hue: 255 },
  { name: "orange", light: "#eb6834", dark: "#d95926", hue: 42 },
  { name: "aqua", light: "#1baf7a", dark: "#199e70", hue: 165 },
  { name: "yellow", light: "#eda100", dark: "#c98500", hue: 85 },
  { name: "pink", light: "#e87ba4", dark: "#d55181", hue: 350 },
  { name: "green", light: "#008300", dark: "#008300", hue: 145 },
  { name: "violet", light: "#6250d6", dark: "#9085e9", hue: 295 },
  { name: "red", light: "#e34948", dark: "#e66767", hue: 27 },
];

/** Lightness band the validator enforces, per mode. */
const BAND = { light: [0.45, 0.75], dark: [0.5, 0.66] };
const CHROMAS = [0.17, 0.15, 0.13, 0.115, 0.1, 0.085];

function check(hexes, mode) {
  const { report } = validate(hexes, {
    mode,
    surface: SURFACE[mode],
    pairs: "all",
  });
  const row = (label) => report.find((r) => r[0] === label);
  const cvd = row("CVD separation");
  const nor = row("Normal-vision floor");
  const band = row("Lightness band");
  const chroma = row("Chroma floor");
  return {
    cvdOk: cvd[1] === "pass" || cvd[1] === "floor",
    norOk: nor[1] === "pass",
    bandOk: band[1] === true,
    chromaOk: chroma[1] === true,
    cvd,
    nor,
  };
}

/** Every in-gamut step for one hue, sweeping lightness inside the band. */
function stepsFor(hue, mode) {
  const [lo, hi] = BAND[mode];
  const out = [];
  for (let L = lo; L <= hi + 1e-9; L += 0.025) {
    for (const C of CHROMAS) {
      const hex = oklchToHex(L, C, hue, { clip: true });
      if (hexToOklch(hex).C >= C - 0.005) {
        out.push(hex);
        break;
      }
    }
  }
  return out;
}

function* subsets(arr, size) {
  function* walk(start, acc) {
    if (acc.length === size) {
      yield [...acc];
      return;
    }
    for (let i = start; i < arr.length; i += 1) {
      acc.push(arr[i]);
      yield* walk(i + 1, acc);
      acc.pop();
    }
  }
  yield* walk(0, []);
}

/** Find one step per hue that clears every floor, backtracking on failures. */
function solve(hues, mode, limit = 1) {
  const options = hues.map((h) => stepsFor(h.hue, mode));
  const found = [];

  const walk = (i, acc) => {
    if (found.length >= limit) return;
    if (i === hues.length) {
      found.push([...acc]);
      return;
    }
    for (const hex of options[i]) {
      const trial = [...acc, hex];
      const r = check(trial, mode);
      if (!r.cvdOk || !r.norOk || !r.bandOk || !r.chromaOk) continue;
      walk(i + 1, trial);
      if (found.length >= limit) return;
    }
  };
  walk(0, []);
  return found;
}

// ---------------------------------------------------------------- part 1
console.log("== documented slots, all-pairs, no re-stepping ==");
for (let size = 8; size >= 3; size -= 1) {
  const passing = [];
  for (const combo of subsets(SLOTS, size)) {
    const light = check(
      combo.map((s) => s.light),
      "light",
    );
    if (!light.cvdOk || !light.norOk || !light.bandOk || !light.chromaOk)
      continue;
    const dark = check(
      combo.map((s) => s.dark),
      "dark",
    );
    if (!dark.cvdOk || !dark.norOk || !dark.bandOk || !dark.chromaOk)
      continue;
    passing.push({ combo, light, dark });
  }
  console.log(`  size ${size}: ${passing.length} passing set(s)`);
  for (const p of passing) {
    console.log(
      `    ${p.combo.map((s) => s.name).join(", ")} | light ${p.light.cvd[2]} / ${p.light.nor[2]} | dark ${p.dark.cvd[2]} / ${p.dark.nor[2]}`,
    );
  }
  if (passing.length) break;
}

// ---------------------------------------------------------------- part 2
console.log("\n== re-stepped hues, all-pairs ==");
for (let size = 8; size >= 4; size -= 1) {
  let found = null;
  for (const combo of subsets(SLOTS, size)) {
    const light = solve(combo, "light", 1);
    if (!light.length) continue;
    const dark = solve(combo, "dark", 1);
    if (!dark.length) continue;
    found = { combo, light: light[0], dark: dark[0] };
    break;
  }
  if (!found) {
    console.log(`  size ${size}: no passing set`);
    continue;
  }
  const l = check(found.light, "light");
  const d = check(found.dark, "dark");
  console.log(`  size ${size}: ${found.combo.map((s) => s.name).join(", ")}`);
  console.log(`    light ${found.light.join(",")} | ${l.cvd[2]} / ${l.nor[2]}`);
  console.log(`    dark  ${found.dark.join(",")} | ${d.cvd[2]} / ${d.nor[2]}`);
  break;
}
