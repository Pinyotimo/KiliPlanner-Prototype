/**
 * The category palette, computed.
 *
 * The map is an all-pairs form: any two pins can sit side by side, so every
 * pair of category hues must clear the floors - not just neighbouring ones.
 * The eight hues the app started with do not (red/orange and aqua/pink
 * collapse), and no re-stepping of all eight rescues them, so the categories
 * fold into service families and each family takes one hue:
 *
 *   red     security
 *   orange  works and land   - road damage, construction, land planning,
 *                               encroachment
 *   aqua    waste and green space - waste, green pin
 *   blue    water services   - water, drainage
 *   violet  sewerage         - sewage
 *   pink    pollution
 *
 * "other" is a residual bucket and takes a surface tone, never a seventh hue.
 *
 * This script picks the steps. It searches the lightness band for the
 * assignment that clears every floor in both modes, then maximises the
 * headroom - the worst pair across the palette - so the palette is not
 * sitting exactly on a threshold. The finished palette is confirmed against
 * the dataviz validator itself before it is written out.
 *
 * The fast checks are ported from `validate_palette.js`; they agree with it.
 *
 * Run: node tools/category-palette.mjs [set] [cvd-min]
 */
import { validate } from "file:///C:/Users/USER/AppData/Local/Temp/claude/bundled-skills/2.1.308/d020aa73c5f46e1ba96917817f3195f4/dataviz/scripts/validate_palette.js";
import { oklchToHex, hexToOklch, cvdDeltaE, deltaE } from "./color.mjs";

const SURFACE = { light: "#fcfeff", dark: "#161c22" };
/** The validator's own bands and floors. */
const BAND = { light: [0.43, 0.77], dark: [0.48, 0.67] };
const CHROMA_FLOOR = 0.1;
const CVD_TARGET = 8;
const NORMAL_FLOOR = 15;

/** The hue anchors, and the palette the app used before the restyle. */
const SLOTS = {
  red: { hue: 27, from: { light: "#e34948", dark: "#e66767" } },
  orange: { hue: 42, from: { light: "#eb6834", dark: "#d95926" } },
  yellow: { hue: 85, from: { light: "#eda100", dark: "#c98500" } },
  green: { hue: 145, from: { light: "#008300", dark: "#008300" } },
  aqua: { hue: 165, from: { light: "#1baf7a", dark: "#199e70" } },
  blue: { hue: 255, from: { light: "#2a78d6", dark: "#3987e5" } },
  violet: { hue: 295, from: { light: "#6250d6", dark: "#9085e9" } },
  pink: { hue: 350, from: { light: "#e87ba4", dark: "#d55181" } },
};

/**
 * Candidate family sets. Set F is the one that clears the CVD target in both
 * modes; the others are kept so the choice stays reproducible.
 */
const SETS = {
  A: ["red", "orange", "green", "aqua", "blue", "pink"],
  C: ["red", "orange", "green", "aqua", "blue", "violet", "pink"],
  D: ["red", "orange", "green", "aqua", "blue", "yellow"],
  E: ["red", "orange", "green", "aqua", "blue", "violet"],
  F: ["red", "orange", "aqua", "blue", "violet", "pink"],
  // five families
  H: ["red", "orange", "aqua", "blue", "pink"],
  I: ["red", "orange", "aqua", "blue", "violet"],
  J: ["red", "orange", "green", "aqua", "blue"],
  K: ["red", "orange", "green", "blue", "pink"],
  // four families
  L: ["red", "orange", "aqua", "blue"],
  M: ["red", "orange", "green", "blue"],
  G: ["yellow", "pink", "green", "violet", "red", "blue"],
};

const SET_NAME = process.argv[2] ?? "F";
const CVD_MIN = Number(process.argv[3] ?? CVD_TARGET);
/**
 * How much headroom to keep above the floors. 1.0 sits exactly on the
 * threshold; a higher margin pushes the steps further apart, at the cost of
 * drifting away from the palette the app already used.
 */
const MARGIN = Number(process.argv[4] ?? 1.05);
/** How much headroom is worth drifting away from the previous palette. */
const LAMBDA = Number(process.argv[5] ?? 0.01);
const NORMAL_MIN = NORMAL_FLOOR * MARGIN;
const CVD_MIN_REQUIRED = CVD_MIN * MARGIN;
const FAMILIES = (SETS[SET_NAME] ?? SETS.F).map((n) => ({ name: n, ...SLOTS[n] }));

const CHROMAS = [0.17, 0.16, 0.15, 0.14, 0.13, 0.12, 0.115, 0.11, 0.105, 0.1];

/** Candidate steps for one family, closest to the previous palette first. */
function stepsFor(family, mode) {
  const [lo, hi] = BAND[mode];
  const target = hexToOklch(family.from[mode]);
  const out = [];
  for (let L = lo; L <= hi + 1e-9; L += 0.005) {
    for (const C of CHROMAS) {
      const hex = oklchToHex(L, C, family.hue, { clip: true });
      const got = hexToOklch(hex);
      if (got.C < CHROMA_FLOOR) continue;
      if (got.L < lo || got.L > hi) continue;
      out.push({
        hex,
        L: got.L,
        C: got.C,
        cost: Math.abs(got.L - target.L) * 10 + Math.abs(got.C - target.C),
      });
      break;
    }
  }
  return out.sort((a, b) => a.cost - b.cost);
}

/**
 * The headroom of an assignment: the worst pair, measured as a fraction of
 * the floor it has to clear. 1.0 means exactly on the threshold.
 */
function headroom(hexes) {
  let worstCvd = Infinity;
  let worstNormal = Infinity;
  for (let i = 0; i < hexes.length; i += 1) {
    for (let j = i + 1; j < hexes.length; j += 1) {
      worstCvd = Math.min(worstCvd, cvdDeltaE(hexes[i], hexes[j]));
      worstNormal = Math.min(worstNormal, deltaE(hexes[i], hexes[j]));
    }
  }
  return {
    cvd: worstCvd,
    normal: worstNormal,
    score: Math.min(worstCvd / CVD_TARGET, worstNormal / NORMAL_FLOOR),
  };
}

/**
 * Any passing assignment, found by branch and bound over the steps - the cost
 * is additive per family, so a branch whose running cost already exceeds the
 * best complete solution cannot improve it.
 */
function findPassing(options, budgetMs = 20000) {
  const deadline = Date.now() + budgetMs;
  let best = null;

  const walk = (i, acc, cost) => {
    if (best && cost >= best.cost) return;
    if (Date.now() > deadline) return;
    if (i === FAMILIES.length) {
      best = { cost, hexes: [...acc] };
      return;
    }
    for (const step of options[i]) {
      const trial = [...acc, step.hex];
      const h = headroom(trial);
      if (h.cvd < CVD_MIN_REQUIRED || h.normal < NORMAL_MIN) continue;
      acc.push(step.hex);
      walk(i + 1, acc, cost + step.cost);
      acc.pop();
    }
  };
  walk(0, [], 0);
  return best;
}

/**
 * Maximise the headroom: start from a passing assignment, then hill-climb -
 * swap one family's step for a better one until no single swap improves the
 * worst pair.
 */
function optimise(mode) {
  const options = FAMILIES.map((f) => stepsFor(f, mode));
  const seed = findPassing(options);
  if (!seed) return null;

  const hexes = [...seed.hexes];
  let best = headroom(hexes);
  const seedReport = { ...best };
  let bestValue = best.score - LAMBDA * 0;

  for (let round = 0; round < 40; round += 1) {
    let improved = false;
    for (let i = 0; i < FAMILIES.length; i += 1) {
      for (const step of options[i]) {
        if (step.hex === hexes[i]) continue;
        const trial = [...hexes];
        trial[i] = step.hex;
        const h = headroom(trial);
        if (h.cvd < CVD_MIN_REQUIRED || h.normal < NORMAL_MIN) continue;
        // More headroom wins, but not at the price of straying far from the
        // palette the app already used - LAMBDA is that trade-off.
        const value = h.score - LAMBDA * step.cost;
        if (value > bestValue + 1e-9) {
          hexes[i] = step.hex;
          best = h;
          bestValue = value;
          improved = true;
        }
      }
    }
    if (!improved) break;
  }
  return { hexes, report: best, seed: { hexes: [...seed.hexes], report: seedReport } };
}

const light = optimise("light");
const dark = optimise("dark");

if (!light || !dark) {
  console.log(`NO PASSING ASSIGNMENT for set ${SET_NAME} at CVD >= ${CVD_MIN}`);
  console.log("light:", light ? "ok" : "none");
  console.log("dark:", dark ? "ok" : "none");
  process.exit(1);
}

// ---------------------------------------------------------------- confirm
let failed = false;
for (const [mode, solution] of [
  ["light", light],
  ["dark", dark],
]) {
  const { report, ok } = validate(solution.hexes, {
    mode,
    surface: SURFACE[mode],
    pairs: "all",
  });
  console.log(`-- ${mode}: ${ok ? "PASS" : "FAIL"}`);
  for (const row of report) console.log(`   ${row[0]}: ${row[1]} - ${row[2]}`);
  if (!ok) failed = true;
}

console.log("\n-- per family --");
FAMILIES.forEach((f, i) => {
  console.log(
    `${f.name.padEnd(7)} hue ${String(f.hue).padStart(3)}  light ${light.hexes[i]}  dark ${dark.hexes[i]}` +
      `   (was ${f.from.light} / ${f.from.dark})`,
  );
});
console.log(
  `\nlight: ${light.hexes.join(",")}\ndark:  ${dark.hexes.join(",")}`,
);
console.log("\n-- closest to the previous palette (no headroom push) --");
console.log(`light: ${light.seed.hexes.join(",")}`);
console.log(`dark:  ${dark.seed.hexes.join(",")}`);
FAMILIES.forEach((f, i) => {
  console.log(
    `${f.name.padEnd(7)} light ${light.seed.hexes[i]}  dark ${dark.seed.hexes[i]}`,
  );
});

if (failed) process.exit(1);
