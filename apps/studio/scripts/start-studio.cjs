const { spawn } = require("node:child_process");
const { formatPreflightSummary, getPaths, getPreflightSummary } = require("./studio-preflight.cjs");

const summary = getPreflightSummary();
const { appRoot } = getPaths();

if (!summary.buildReady) {
  console.error("OpenClaw Studio could not start because build artifacts are missing.");
  console.error(formatPreflightSummary(summary));
  console.error("Run `npm run build` from the project root and try again.");
  process.exit(1);
}

if (!summary.electron.available || !summary.electron.binary) {
  console.error("OpenClaw Studio could not start because a compatible Electron binary is not available for this workspace/platform.");
  console.error(formatPreflightSummary(summary));
  console.error("Run `npm install` from the project root in the current OS environment.");
  console.error("If this workspace was last installed from a different OS, reinstall Electron for the current platform before retrying.");
  console.error("If optional dependencies were skipped, rerun `npm install --include=optional` and then try again.");
  process.exit(1);
}

if (!summary.display.available) {
  console.error("OpenClaw Studio could not start because no Linux display session is available.");
  console.error(formatPreflightSummary(summary));
  console.error("Start an X server / Wayland session and export `DISPLAY` or `WAYLAND_DISPLAY`, then try again.");
  process.exit(1);
}

const electronBinary = summary.electron.binary;
const electronArgs = [
  ...(process.env.OPENCLAW_STUDIO_NO_SANDBOX === "1" ? ["--no-sandbox", "--disable-setuid-sandbox"] : []),
  "."
];
const child = spawn(electronBinary, electronArgs, {
  cwd: appRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    ...(process.env.OPENCLAW_STUDIO_NO_SANDBOX === "1" ? { ELECTRON_DISABLE_SANDBOX: "1" } : {}),
    ...(summary.display.env ?? {})
  }
});

let forwardingSignal = false;

function forwardSignal(signal) {
  if (forwardingSignal || child.killed) {
    return;
  }

  forwardingSignal = true;
  child.kill(signal);
}

child.on("error", (error) => {
  const message = error instanceof Error ? error.message : String(error);

  console.error(`OpenClaw Studio could not launch Electron: ${message}`);
  process.exit(1);
});

for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
  process.on(signal, () => {
    forwardSignal(signal);
  });
}

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
