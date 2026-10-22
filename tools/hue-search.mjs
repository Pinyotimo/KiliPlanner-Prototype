/**
 * Search for an issue-category hue assignment that keeps *all* pairs legible.
 *
 * The 12 issue categories collapse onto a small set of identity hues. Map
 * markers can sit side by side, so their pairs must all clear the floors, not
 * just adjacent ones. This enumerates which subsets of the reference ramp
 * survive the all-pairs test, and which display orders keep the *adjacent*
 * test safe in both modes.
 *
 * Run: node tools/hue-search.mjs
 */
import { validate } from "file:///C:/Users/USER/AppData/Local/Temp/claude/bundled-skills/2.1.308/d020aa73c5f46e1ba96917817f3195f4/dataviz/scripts/validate_palette.js";
import { oklchToHex, hexToOklch } from "./color.mjs";

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

const HUES = Object.keys(LIGHT);
const SURFACE = { light: "#fcfeff", dark: "#161c22" };

function allPairsOk(hues, mode) {
  const { report } = validate(hues.map((h) => (mode === "light" ? LIGHT[h] : DARK[h])), {
    mode,
    surface: SURFACE[mode],
    pairs: "all",
  });
  const cvd = report.find((r) => r[0] === "CVD separation");
  const nor = report.find((r) => r[0] === "Normal-vision floor");
  return {
    cvdPass: cvd[1] === "pass",
    cvdFloor: cvd[1] === "floor",
    norPass: nor[1] === "pass",
    cvdDetail: cvd[2],
    norDetail: nor[2],
  };
}

console.log("=== All-pairs viability per hue set ===");
const viable = [];
for (let size = 8; size >= 3; size -= 1) {
  const subsets = [];
  const walk = (start, acc) => {
    if (acc.length === size) {
      subsets.push([...acc]);
      return;
    }
    for (let i = start; i < HUES.length; i += 1) {
      acc.push(HUES[i]);
      walk(i + 1, acc);
      acc.pop();
    }
  };
  walk(0, []);
  for (const set of subsets) {
    const l = allPairsOk(set, "light");
    const d = allPairsOk(set, "dark");
    const hardOk = l.norPass && d.norPass;
    const cvdOk = l.cvdPass || l.cvdFloor;
    const cvdOkD = d.cvdPass || d.cvdFloor;
    if (hardOk && cvdOk && cvdOkD) {
      viable.push({ set, l, d });
      console.log(
        `  size ${size}  ${set.join(",").padEnd(48)} normal PASS  cvd ${l.cvdPass ? "pass" : "floor"}/${d.cvdPass ? "pass" : "floor"}`,
      );
    }
  }
  if (viable.length) break;
}

console.log(`\n${viable.length} hue set(s) survive the all-pairs test.`);

// ----------------------------------------------------- re-step a failing set
//
// If nothing survives, re-step individual hues (hold the hue, move the
// lightness) until the hard floors clear. Snapping to a passing step is the
// documented way to bring a brand ramp into the method.

console.log("\n=== Re-step search over the 8 reference hues ===");

function stepVariants(hexes, mode) {
  // Candidate steps: the documented ramp steps for each hue, per mode.
  const RAMPS = {
    light: {
      blue: ["#184f95", "#256abf", "#2a78d6", "#3987e5", "#5598e7", "#6da7ec"],
      orange: ["#a33d16", "#c04a1c", "#d95926", "#eb6834"],
      aqua: ["#127a56", "#158962", "#199e70", "#1baf7a", "#2fbd87"],
      yellow: ["#a06f00", "#b57c00", "#c98500", "#eda100"],
      magenta: ["#c14a72", "#d55181", "#e87ba4", "#f194b4"],
      green: ["#006300", "#008300", "#0f9b0f"],
      violet: ["#4a3aa7", "#6250d6", "#7a6ae0", "#9085e9"],
      red: ["#c22b2b", "#d03b3b", "#e34948", "#e66767"],
    },
    dark: {
      blue: ["#256abf", "#2a78d6", "#3987e5", "#5598e7"],
      orange: ["#b8471a", "#c94f1f", "#d95926"],
      aqua: ["#128257", "#199e70", "#1baf7a", "#2fbd87"],
      yellow: ["#b57c00", "#c98500", "#d99a12"],
      magenta: ["#b8436e", "#d55181", "#e87ba4"],
      green: ["#006300", "#008300", "#0f9b0f"],
      violet: ["#6250d6", "#7a6ae0", "#9085e9", "#a79ef0"],
      red: ["#c22b2b", "#d03b3b", "#e34948", "#e66767"],
    },
  };
  return RAMPS[mode];
}

function searchReStepped(hues, mode) {
  const ramps = stepVariants(hues, mode);
  const options = hues.map((h) => ramps[h]);
  const results = [];
  const walk = (i, acc) => {
    if (i === options.length) {
      const { report } = validate(acc, { mode, surface: SURFACE[mode], pairs: "all" });
      const cvd = report.find((r) => r[0] === "CVD separation");
      const nor = report.find((r) => r[0] === "Normal-vision floor");
      if (nor[1] === "pass" && (cvd[1] === "pass" || cvd[1] === "floor")) {
        results.push({ acc: [...acc], cvd: cvd[1], nor: nor[1] });
      }
      return;
    }
    for (const hex of options[i]) {
      acc.push(hex);
      walk(i + 1, acc);
      acc.pop();
    }
  };
  walk(0, []);
  return results;
}

for (const size of [7, 6, 5]) {
  const subsets = [];
  const walk = (start, acc) => {
    if (acc.length === size) {
      subsets.push([...acc]);
      return;
    }
    for (let i = start; i < HUES.length; i += 1) {
      acc.push(HUES[i]);
      walk(i + 1, acc);
      acc.pop();
    }
  };
  walk(0, []);

  // Security keeps red: it is the reserved critical colour, so every candidate
  // set must contain it.
  const required = subsets.filter((s) => s.includes("red"));

  const found = [];
  for (const set of required) {
    const l = searchReStepped(set, "light");
    const d = searchReStepped(set, "dark");
    if (l.length && d.length) {
      found.push({ set, l, d });
    }
  }

  for (const { set, l, d } of found) {
    // Prefer the combination closest to the documented steps.
    const rank = (r) => r.acc.length;
    l.sort((a, b) => rank(a) - rank(b));
    d.sort((a, b) => rank(a) - rank(b));
    console.log(
      `\n  SET ${set.join(",")}  (${size} hues)  light ${l.length} combos, dark ${d.length} combos`,
    );
    console.log(`    light: ${l[0].acc.join(",")}  [cvd ${l[0].cvd}]`);
    console.log(`    dark:  ${d[0].acc.join(",")}  [cvd ${d[0].cvd}]`);
  }
  if (found.length) break;
}
