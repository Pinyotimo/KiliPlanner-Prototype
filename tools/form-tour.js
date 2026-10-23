// Drives the report wizard in the browser and stops on a given step.
//
//   node tools/shoot.mjs "http://localhost:4173/app#step=5" out.png \
//     --eval "$(cat tools/form-tour.js)"
//
// The step number comes from the URL hash, so one script covers every step.
// It exists so the wizard can be photographed end to end without a person
// clicking through it - the labels, the hints and the error states are the
// things worth looking at.

(async () => {
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const target = Number((location.hash.split("=")[1] || "1"));

  const setValue = (el, value) => {
    if (!el) return false;
    const proto =
      el instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : el instanceof HTMLSelectElement
          ? HTMLSelectElement.prototype
          : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, value);
    el.dispatchEvent(
      new Event(el instanceof HTMLSelectElement ? "change" : "input", {
        bubbles: true,
      }),
    );
    return true;
  };

  const clickText = (text, selector = "button") => {
    const el = [...document.querySelectorAll(selector)].find(
      (node) => node.textContent.trim() === text,
    );
    if (el) el.click();
    return !!el;
  };

  const currentStep = () => {
    const match = document.body.textContent.match(/Step (\d) of 7/);
    return match ? Number(match[1]) : 0;
  };

  const makePhoto = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#4b7f52";
    ctx.fillRect(0, 0, 640, 480);
    ctx.fillStyle = "#1d1d1f";
    ctx.fillRect(120, 120, 220, 200);
    return new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.8));
  };

  const attachPhotos = async () => {
    const blob = await makePhoto();
    const inputs = [...document.querySelectorAll('input[type="file"]')];
    for (const input of inputs) {
      const dt = new DataTransfer();
      dt.items.add(new File([blob], "photo.jpg", { type: "image/jpeg" }));
      input.files = dt.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
      await sleep(1500);
    }
  };

  // Open the report: switch to the map, drop a pin inside the estate, confirm.
  [...document.querySelectorAll("button,a")]
    .find((el) => el.textContent.trim().toLowerCase().startsWith("report issue"))
    ?.click();
  let container = null;
  for (let i = 0; i < 40 && !container; i++) {
    await sleep(400);
    container = document.querySelector(".leaflet-container");
  }
  if (!container) return "no map container";
  const rect = container.getBoundingClientRect();
  container.dispatchEvent(
    new MouseEvent("click", {
      clientX: rect.left + rect.width * 0.51,
      clientY: rect.top + rect.height * 0.47,
      bubbles: true,
      cancelable: true,
      view: window,
    }),
  );
  await sleep(2500);
  clickText("Confirm");
  await sleep(2000);

  for (let guard = 0; guard < 12; guard++) {
    const step = currentStep();
    if (step >= target || step === 0) break;

    if (step === 2) {
      setValue(
        document.querySelector("#report-unsafe-time"),
        "Evening (6 PM - 10 PM)",
      );
      setValue(
        document.querySelector("#report-description"),
        "A wide drain at the play area is blocked with waste and water is pooling across the footpath.",
      );
      await sleep(400);
    }
    if (step === 4) {
      const skip = [...document.querySelectorAll("button")].find((b) =>
        b.textContent.includes("Continue without checking"),
      );
      if (skip) skip.click();
      await sleep(600);
    }
    if (step === 5) {
      await attachPhotos();
    }
    if (step === 6) {
      const box = document.querySelector('input[type="checkbox"]');
      if (box && !box.checked) box.click();
      await sleep(400);
    }

    clickText("Continue");
    await sleep(1500);
  }

  return `on step ${currentStep()} (wanted ${target})`;
})();
