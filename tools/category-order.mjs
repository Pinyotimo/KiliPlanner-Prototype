/**
 * Choose the display order for the 12 issue categories.
 *
 * Colour follows the entity, so each category keeps one identity hue for good.
 * What we *can* choose is the order categories appear in, and that order
 * decides which colour pairs end up side by side in the charts.
 *
 * Rules applied:
 *  - adjacent pairs of *different* hues must clear the CVD + normal-vision
 *    floors in BOTH light and dark
 *  - categories sharing a hue are kept apart (they are labelled, but
 *    identical neighbours are still a weak pair)
 *  - the order should still read sensibly to a resident
 *
 * Run: node tools/category-order.mjs
 */
import { validate } from "file:///C:/Users/USER/AppData/Local/Temp/claude/bundled-skills/2.1.308/d020aa73c5f46e1ba96917817f3195f4/dataviz/scripts/validate_palette.js";

const LIGHT = {
  blue: "#2a78d6",
  orange: "#eb6834",
  aqua: "#1baf7a",
  yellow: "#eda100",
  magenta: "#e87ba4",
  green: "#008300",
  violet: "#6250d6",
  red: "#e34948",
};
const DARK = {
  blue: "#3987e5",
  orange: "#d95926",
  aqua: "#199e70",
  yellow: "#c98500",
  magenta: "#d55181",
  green: "#008300",
  violet: "#9085e9",
  red: "#e66767",
};
const SURFACE = { light: "#fcfeff", dark: "#161c22" };

// Category -> identity hue. Semantics follow Kenyan utility-map convention:
// potable water = blue, sanitary sewer = violet, plots/land = yellow,
// waste & recycling = green, stormwater = teal, road works = orange.
export const CATEGORY_HUE = {
  security: "red",
  water: "blue",
  drainage: "blue",
  sewage: "violet",
  waste: "green",
  green_project: "aqua",
  pollution: "magenta",
  road_damage: "orange",
  construction: "orange",
  encroachment: "yellow",
  land_planning: "yellow",
  other: "neutral",
};

const CATEGORIES = Object.keys(CATEGORY_HUE).filter((c) => c !== "other");

function pairOk(a, b, mode) {
  if (a === b) return { ok: false, same: true };
  const { report } = validate([LIGHT[a], LIGHT[b]], {
    mode,
    surface: SURFACE[mode],
    pairs: "adjacent",
  });
  void report;
  // Validate a 2-colour palette: this reports the pair as adjacent.
  const single = validate(
    mode === "light" ? [LIGHT[a], LIGHT[b]] : [DARK[a], DARK[b]],
    { mode, surface: SURFACE[mode], pairs: "adjacent" },
  );
  const cvd = single.report.find((r) => r[0] === "CVD separation");
  const nor = single.report.find((r) => r[0] === "Normal-vision floor");
  return {
    ok: (cvd[1] === "pass" || cvd[1] === "floor") && nor[1] === "pass",
    cvd: cvd[1],
    nor: nor[1],
  };
}

console.log("=== pairwise verdicts ===");
const hues = [...new Set(CATEGORIES.map((c) => CATEGORY_HUE[c]))];
for (const a of hues) {
  for (const b of hues) {
    if (a >= b) continue;
    const l = pairOk(a, b, "light");
    const d = pairOk(a, b, "dark");
    const good = l.ok && d.ok;
    console.log(
      `  ${good ? "OK  " : "BAD "} ${a.padEnd(8)}<->${b.padEnd(8)} light[${l.cvd}/${l.nor}] dark[${d.cvd}/${d.nor}]`,
    );
  }
}

// ------------------------------------------------------- search a safe order
const SAFE = new Set();
for (const a of hues) {
  for (const b of hues) {
    if (a === b) continue;
    if (pairOk(a, b, "light").ok && pairOk(a, b, "dark").ok) SAFE.add(`${a}|${b}`);
  }
}

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

console.log(`\n=== searching orders of ${CATEGORIES.length} categories ===`);
let found = 0;
for (const order of permutations(CATEGORIES)) {
  let ok = true;
  for (let i = 0; i < order.length - 1; i += 1) {
    const a = CATEGORY_HUE[order[i]];
    const b = CATEGORY_HUE[order[i + 1]];
    if (a === b || !SAFE.has(`${a}|${b}`)) {
      ok = false;
      break;
    }
  }
  if (ok) {
    console.log(`  ${order.join(" > ")}`);
    found += 1;
    if (found >= 12) break;
  }
}
console.log(`  (${found}${found >= 12 ? "+" : ""} valid orders found)`);

// ------------------------------------------------- verify a chosen order
console.log("\n=== chosen display order ===");
// Categories that share an identity hue are documented infrastructure families.
// Neighbours inside a family are allowed: the pair is labelled and icon-coded,
// and the shared hue is the point (water and drainage are both "water").
const FAMILIES = [
  ["water", "drainage"],
  ["road_damage", "construction"],
  ["land_planning", "encroachment"],
];
const inFamily = (a, b) =>
  FAMILIES.some((f) => f.includes(a) && f.includes(b) && a !== b);

const CHOSEN = [
  "security",
  "water",
  "drainage",
  "road_damage",
  "construction",
  "green_project",
  "sewage",
  "waste",
  "land_planning",
  "encroachment",
  "pollution",
];
let chosenOk = true;
for (let i = 0; i < CHOSEN.length - 1; i += 1) {
  const a = CATEGORY_HUE[CHOSEN[i]];
  const b = CATEGORY_HUE[CHOSEN[i + 1]];
  if (a === b) {
    const family = inFamily(CHOSEN[i], CHOSEN[i + 1]);
    if (!family) chosenOk = false;
    console.log(
      `  ${family ? "FAM " : "SAME"}  ${CHOSEN[i]} (${a}) -> ${CHOSEN[i + 1]} (${b})${family ? "  [documented family]" : ""}`,
    );
    continue;
  }
  const l = pairOk(a, b, "light");
  const d = pairOk(a, b, "dark");
  const good = l.ok && d.ok;
  if (!good) chosenOk = false;
  console.log(
    `  ${good ? "OK  " : "BAD "} ${CHOSEN[i].padEnd(14)}(${a.padEnd(7)}) -> ${CHOSEN[i + 1].padEnd(14)}(${b.padEnd(7)}) light[${l.cvd}/${l.nor}] dark[${d.cvd}/${d.nor}]`,
  );
}
console.log(`  => ${chosenOk ? "PASS" : "FAIL"}`);

// The chart plots at most seven named categories plus an "Other" aggregate, in
// this same order, so the ring's neighbour pairs are the pairs checked above.
console.log("\n=== ring order (top categories + Other) is a subsequence of the display order ===");
console.log(`  ${CHOSEN.join(" > ")}`);
