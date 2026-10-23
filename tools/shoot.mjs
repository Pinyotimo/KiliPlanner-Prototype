// Screenshot helper.
//
// Drives headless Chrome over the DevTools Protocol so a change can be
// looked at, not just type-checked. No dependencies: node 22+ ships a
// global WebSocket, and CDP is plain JSON over it.
//
//   node tools/shoot.mjs <url> <outfile> [--wait 4000] [--eval "js"] [--dark]
//
// `--eval` runs in the page after the load event and before the shot, so a
// single-page app can be put into the state you want to photograph.

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tmpdir } from "node:os";

const CHROME =
  process.env.CHROME_PATH ||
  "C:/Program Files/Google/Chrome/Application/chrome.exe";

const args = process.argv.slice(2);
const url = args[0];
const out = args[1];
if (!url || !out) {
  console.error("usage: node tools/shoot.mjs <url> <out.png> [--wait ms] [--eval js]");
  process.exit(1);
}

function flag(name, fallback) {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return fallback;
  return args[index + 1];
}

const wait = Number(flag("wait", "4500"));
const post = Number(flag("post", "2500"));
const script = flag("eval", "");
const dark = args.includes("--dark");
const port = 9333 + Math.floor(Math.random() * 400);
const profile = resolve(tmpdir(), `kiliplanner-shot-${port}`);

mkdirSync(profile, { recursive: true });

const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${profile}`,
    "--window-size=1440,900",
    "--hide-scrollbars",
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "about:blank",
  ],
  { stdio: "ignore" },
);

function cleanup() {
  try {
    chrome.kill();
  } catch {
    /* already gone */
  }
  try {
    rmSync(profile, { recursive: true, force: true });
  } catch {
    /* best effort */
  }
}

process.on("exit", cleanup);

async function targetSocket() {
  for (let attempt = 0; attempt < 60; attempt++) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/list`);
      const targets = await response.json();
      const page = targets.find((t) => t.type === "page");
      if (page?.webSocketDebuggerUrl) return page.webSocketDebuggerUrl;
    } catch {
      /* chrome is still starting */
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("Chrome did not expose a page target");
}

const socketUrl = await targetSocket();
const socket = new WebSocket(socketUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

let nextId = 1;
const pending = new Map();
const events = [];

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve: done, reject: fail } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) fail(new Error(message.error.message));
    else done(message.result);
    return;
  }
  events.push(message);
});

function send(method, params = {}) {
  const id = nextId++;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((done, fail) => pending.set(id, { resolve: done, reject: fail }));
}

await send("Page.enable");
await send("Runtime.enable");
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440,
  height: 900,
  deviceScaleFactor: 1,
  mobile: false,
});

// `--inject` runs before the app does, on every navigation. It is how a
// page can be put into a state it would not otherwise reach - dropping a
// header, say, so the app talks to the API the way an anonymous visitor
// does while the shell still thinks it is signed in.
const inject = flag("inject", "");
const injectFile = flag("inject-file", "");
if (inject) {
  await send("Page.addScriptToEvaluateOnNewDocument", { source: inject });
} else if (injectFile) {
  const { readFileSync } = await import("node:fs");
  await send("Page.addScriptToEvaluateOnNewDocument", {
    source: readFileSync(injectFile, "utf8"),
  });
}

await send("Page.navigate", { url });

// Wait for the load event, then let the app settle (tiles, charts, fonts).
const deadline = Date.now() + 30000;
while (Date.now() < deadline) {
  if (events.some((e) => e.method === "Page.loadEventFired")) break;
  await new Promise((r) => setTimeout(r, 150));
}
await new Promise((r) => setTimeout(r, wait));

if (dark) {
  await send("Runtime.evaluate", {
    expression:
      "document.documentElement.classList.add('dark');localStorage.setItem('kiliplanner-theme-mode','dark');",
  });
  await new Promise((r) => setTimeout(r, 1200));
}

if (script) {
  const result = await send("Runtime.evaluate", {
    expression: script,
    awaitPromise: true,
    returnByValue: true,
  });
  if (result.exceptionDetails) {
    console.error("page script failed:", result.exceptionDetails.text);
  } else if (result.result?.value !== undefined) {
    console.log("script result:", JSON.stringify(result.result.value));
  }
  await new Promise((r) => setTimeout(r, post));
}

// Step through a wizard: click "Continue" n times, waiting between clicks.
const continueTimes = Number(flag("continue", "0"));
if (continueTimes > 0) {
  for (let i = 0; i < continueTimes; i++) {
    await send("Runtime.evaluate", {
      expression: `(async () => {
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        const btn = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'Continue');
        if (!btn) return 'no continue button';
        btn.click();
        await sleep(1200);
        return 'continued';
      })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    await new Promise((r) => setTimeout(r, 600));
  }
  await new Promise((r) => setTimeout(r, 1500));
}

const shot = await send("Page.captureScreenshot", { format: "png" });
mkdirSync(dirname(resolve(out)), { recursive: true });
writeFileSync(resolve(out), Buffer.from(shot.data, "base64"));
console.log("wrote", out);

socket.close();
cleanup();
process.exit(0);
