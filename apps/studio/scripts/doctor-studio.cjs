const { formatPreflightSummary, getPreflightSummary } = require("./studio-preflight.cjs");

const summary = getPreflightSummary();

console.log("OpenClaw Studio doctor");
console.log(formatPreflightSummary(summary));

if (!summary.startReady) {
  console.log("");
  console.log("Recommended next steps:");

  if (!summary.buildReady) {
    console.log("- Run `npm run build` from the repo root.");
  }

  if (!summary.electron.available) {
    console.log("- Run `npm install` from the repo root.");
    console.log("- If optional dependencies were skipped, rerun `npm install --include=optional`.");
  }

  if (!summary.display.available) {
    console.log("- Start an X server / Wayland session and export `DISPLAY` or `WAYLAND_DISPLAY`.");
    console.log("- In WSL, make sure your desktop bridge is running before `npm start`.");
  }
}
